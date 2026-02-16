import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Prospect, ProspectDocument, SbcStatus } from './schemas/prospect.schema';
import { CreateProspectDto } from './dto/create-prospect.dto';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { EbooksService } from '../ebooks/ebooks.service';

@Injectable()
export class ProspectsService {
    private readonly logger = new Logger(ProspectsService.name);
    private transporter;

    constructor(
        @InjectModel(Prospect.name) private prospectModel: Model<ProspectDocument>,
        private configService: ConfigService,
        private ebooksService: EbooksService
    ) {
        // Initialize Nodemailer Transporter
        // Uses env vars or defaults to a mock/dry-run if missing
        const host = this.configService.get<string>('SMTP_HOST');
        if (host) {
            this.transporter = nodemailer.createTransport({
                host: this.configService.get<string>('SMTP_HOST'),
                port: this.configService.get<number>('SMTP_PORT'),
                secure: this.configService.get<string>('SMTP_SECURE') === 'true',
                auth: {
                    user: this.configService.get<string>('SMTP_USER'),
                    pass: this.configService.get<string>('SMTP_PASS'),
                },
                tls: {
                    rejectUnauthorized: false
                }
            });
        } else {
            this.logger.warn('SMTP_HOST not configured. Email sending will be skipped/mocked.');
        }
    }

    async create(createProspectDto: CreateProspectDto): Promise<Prospect> {
        const createdProspect = new this.prospectModel(createProspectDto);
        const result = await createdProspect.save();

        // Trigger Email Sending (Fire and forget to not block response)
        this.sendEbookEmail(result, createProspectDto.ebookId).catch(err =>
            this.logger.error(`Failed to send email to ${result.email}`, err)
        );

        return result;
    }

    private async sendEbookEmail(prospect: Prospect, ebookId: string) {
        if (!this.transporter && !this.configService.get<string>('SMTP_HOST')) {
            this.logger.log(`[MOCK EMAIL] To: ${prospect.email}, EbookId: ${ebookId} - Content: Here are your ebooks!`);
            return;
        }

        const ebooks = await this.ebooksService.findVisible();
        const attachments: { filename: string; path: string; }[] = [];
        const ebookTitles: string[] = [];

        for (const ebook of ebooks) {
            ebookTitles.push(ebook.title);
            if (ebook.pdfUrl) {
                let attachmentPath = ebook.pdfUrl;
                // If the URL points to our own server's uploads, resolve to local path
                if (ebook.pdfUrl.includes('/uploads/')) {
                    // Extract filename from URL
                    const filename = ebook.pdfUrl.split('/uploads/').pop();
                    if (filename) {
                        // Assuming uploads are in project root/uploads. 
                        attachmentPath = require('path').join(process.cwd(), 'uploads', filename);
                    }
                }

                attachments.push({
                    filename: `${ebook.title}.pdf`,
                    path: attachmentPath
                });
            }
        }

        const subject = `Vos Ebooks SBC offerts !`;

        const mailOptions = {
            from: this.configService.get<string>('SMTP_FROM', '"SBC Ebooks" <noreply@example.com>'),
            to: prospect.email,
            subject: subject,
            text: `Bonjour ${prospect.firstName},\n\nMerci de votre intérêt. Voici les ebooks promis pour vous aider à démarrer.\n\nVous trouverez vos ebooks en pièce jointe.\n\nCordialement,\nL'équipe SBC`,
            html: `<p>Bonjour <strong>${prospect.firstName}</strong>,</p>
                   <p>Merci de votre intérêt. Voici les ebooks promis pour vous aider à démarrer :</p>
                   <ul>
                    ${ebookTitles.map(title => `<li>${title}</li>`).join('')}
                   </ul>
                   <p>Vous trouverez vos ebooks en pièce jointe.</p>
                   <p>Cordialement,<br>L'équipe SBC</p>`,
            attachments: attachments
        };

        try {
            await this.transporter.sendMail(mailOptions);
            this.logger.log(`Email sent to ${prospect.email} with ebook ${ebookTitle}`);
        } catch (error) {
            this.logger.error(`Failed to send email to ${prospect.email}`, error);
        }
    }

    async findAll(filter?: { ebookId?: string; date?: string; sbcStatus?: string; adminId?: string }): Promise<Prospect[]> {
        const query: any = {};
        if (filter?.adminId) query.adminId = filter.adminId;
        if (filter?.ebookId) query.ebookId = filter.ebookId;
        if (filter?.sbcStatus) query.sbcStatus = filter.sbcStatus;
        if (filter?.date) {
            // Simple date filtering (exact day) - improvements needed for ranges
            const start = new Date(filter.date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(filter.date);
            end.setHours(23, 59, 59, 999);
            query.createdAt = { $gte: start, $lte: end };
        }
        return this.prospectModel.find(query).sort({ createdAt: -1 }).exec();
    }

    async updateStatus(id: string, status: SbcStatus): Promise<Prospect | null> {
        return this.prospectModel.findByIdAndUpdate(id, { sbcStatus: status }, { new: true }).exec();
    }

    async getStats(adminId?: string) {
        const filter: any = {};
        if (adminId) filter.adminId = adminId;

        const total = await this.prospectModel.countDocuments(filter);
        const inscribed = await this.prospectModel.countDocuments({ ...filter, sbcStatus: SbcStatus.INSCRIT });
        const subscribers = await this.prospectModel.countDocuments({ ...filter, sbcStatus: SbcStatus.ABONNE });
        const verifiedMembers = await this.prospectModel.countDocuments({ ...filter, membershipFound: true });

        const conversionRate = total > 0 ? ((inscribed + subscribers) / total) * 100 : 0;
        const verifiedConversionRate = total > 0 ? (verifiedMembers / total) * 100 : 0;

        return {
            total,
            inscribed,
            subscribers,
            verifiedMembers,
            conversionRate: parseFloat(conversionRate.toFixed(2)),
            verifiedConversionRate: parseFloat(verifiedConversionRate.toFixed(2))
        };
    }

    /**
     * Call the external SBC API to check if a user exists
     */
    private async checkMembershipWithSBC(email: string, phone?: string): Promise<boolean> {
        const SBC_API_URL = 'https://sniperbuisnesscenter.com/api/users/check-existence';

        try {
            const payload: { email?: string; phoneNumber?: string } = {};
            if (email) payload.email = email;
            if (phone) payload.phoneNumber = phone;

            const response = await fetch(SBC_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                this.logger.warn(`SBC API returned ${response.status} for ${email}`);
                return false;
            }

            const data = await response.json();
            return data?.success && data?.data?.exists === true;
        } catch (error) {
            this.logger.error(`Failed to check SBC membership for ${email}`, error);
            return false;
        }
    }

    /**
     * Verify a single prospect's membership status
     */
    async verifyProspectMembership(prospectId: string): Promise<Prospect | null> {
        const prospect = await this.prospectModel.findById(prospectId);
        if (!prospect) {
            this.logger.warn(`Prospect ${prospectId} not found`);
            return null;
        }

        // Skip if already confirmed as member
        if (prospect.membershipFound) {
            this.logger.log(`Prospect ${prospectId} already verified as member, skipping`);
            return prospect;
        }

        const isMember = await this.checkMembershipWithSBC(prospect.email, prospect.whatsapp);

        const updateData: any = {
            lastVerifiedAt: new Date(),
            membershipFound: isMember
        };

        // If member found, update status to INSCRIT
        if (isMember && prospect.sbcStatus === SbcStatus.NON_INSCRIT) {
            updateData.sbcStatus = SbcStatus.INSCRIT;
        }

        return this.prospectModel.findByIdAndUpdate(prospectId, updateData, { new: true }).exec();
    }

    /**
     * Batch verify prospects that need checking
     * - Skips prospects already confirmed as members
     * - Only re-checks prospects not verified in the last 24 hours
     * - Respects rate limiting with delays between calls
     */
    async batchVerifyMemberships(batchSize: number = 10): Promise<{ checked: number; newMembers: number }> {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // Find prospects that need verification:
        // 1. Not already confirmed as members
        // 2. Either never verified OR verified more than 24 hours ago
        const prospectsToVerify = await this.prospectModel.find({
            membershipFound: { $ne: true },
            $or: [
                { lastVerifiedAt: { $exists: false } },
                { lastVerifiedAt: null },
                { lastVerifiedAt: { $lt: twentyFourHoursAgo } }
            ]
        })
            .limit(batchSize)
            .exec();

        this.logger.log(`Batch verification: found ${prospectsToVerify.length} prospects to verify`);

        let checked = 0;
        let newMembers = 0;

        for (const prospect of prospectsToVerify) {
            const isMember = await this.checkMembershipWithSBC(prospect.email, prospect.whatsapp);

            const updateData: any = {
                lastVerifiedAt: new Date(),
                membershipFound: isMember
            };

            if (isMember) {
                newMembers++;
                if (prospect.sbcStatus === SbcStatus.NON_INSCRIT) {
                    updateData.sbcStatus = SbcStatus.INSCRIT;
                }
                this.logger.log(`✅ Prospect ${prospect.email} verified as member`);
            }

            await this.prospectModel.findByIdAndUpdate(prospect._id, updateData);
            checked++;

            // Wait 3 seconds between API calls to respect rate limits
            if (checked < prospectsToVerify.length) {
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }

        this.logger.log(`Batch verification complete: ${checked} checked, ${newMembers} new members found`);
        return { checked, newMembers };
    }

    /**
     * Get verification-specific statistics
     */
    async getVerificationStats(adminId?: string) {
        const filter: any = {};
        if (adminId) filter.adminId = adminId;

        const total = await this.prospectModel.countDocuments(filter);
        const verifiedMembers = await this.prospectModel.countDocuments({ ...filter, membershipFound: true });
        const pendingVerification = await this.prospectModel.countDocuments({
            ...filter,
            membershipFound: { $ne: true },
            $or: [
                { lastVerifiedAt: { $exists: false } },
                { lastVerifiedAt: null },
                { lastVerifiedAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
            ]
        });
        const lastVerification = await this.prospectModel
            .findOne({ ...filter, lastVerifiedAt: { $exists: true } })
            .sort({ lastVerifiedAt: -1 })
            .select('lastVerifiedAt')
            .exec();

        const verifiedConversionRate = total > 0 ? (verifiedMembers / total) * 100 : 0;

        return {
            total,
            verifiedMembers,
            pendingVerification,
            verifiedConversionRate: parseFloat(verifiedConversionRate.toFixed(2)),
            lastVerifiedAt: lastVerification?.lastVerifiedAt || null
        };
    }
}
