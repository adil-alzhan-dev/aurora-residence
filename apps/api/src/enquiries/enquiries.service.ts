import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { ResidenceStatus } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateEnquiryDto } from './dto/create-enquiry.dto.js';

export interface EnquiryReceipt {
  received: true;
  residence: string | null;
}

@Injectable()
export class EnquiriesService {
  private readonly logger = new Logger(EnquiriesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEnquiryDto): Promise<EnquiryReceipt> {
    const receipt: EnquiryReceipt = { received: true, residence: dto.residence ?? null };
    if (dto.website) {
      this.logger.warn('Honeypot field filled, enquiry dropped');
      return receipt;
    }

    const residence = dto.residence ? await this.findOpenResidence(dto.residence) : null;
    const note = residence
      ? `Enquiry received from the site, residence ${dto.residence} is ${statusLabel(residence.status)}, status not changed`
      : 'Enquiry received from the site, no residence selected';

    await this.prisma.enquiry.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email.toLowerCase(),
        comment: dto.comment ?? '',
        residenceId: residence?.id ?? null,
        locale: dto.locale ?? 'EN',
        currency: dto.currency ?? 'USD',
        source: dto.source,
        activity: { create: { type: 'ENQUIRY_RECEIVED', note } },
      },
      select: { id: true },
    });
    return receipt;
  }

  private async findOpenResidence(number: string) {
    const residence = await this.prisma.residence.findUnique({
      where: { number },
      select: { id: true, status: true },
    });
    if (!residence) throw new NotFoundException(`Residence ${number} not found`);
    if (residence.status === 'SOLD') {
      throw new BadRequestException(`Residence ${number} is already sold, please choose another one`);
    }
    return residence;
  }
}

function statusLabel(status: ResidenceStatus): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}
