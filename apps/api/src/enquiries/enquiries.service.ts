import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { ResidenceStatus } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateEnquiryDto, ENQUIRY_SOURCES } from './dto/create-enquiry.dto.js';

export interface EnquiryReceipt {
  received: true;
  residence: string;
}

@Injectable()
export class EnquiriesService {
  private readonly logger = new Logger(EnquiriesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEnquiryDto): Promise<EnquiryReceipt> {
    const receipt: EnquiryReceipt = { received: true, residence: dto.residence };
    if (dto.website) {
      this.logger.warn('Honeypot field filled, enquiry dropped');
      return receipt;
    }

    const residence = await this.prisma.residence.findUnique({
      where: { number: dto.residence },
      select: { id: true, status: true },
    });
    if (!residence) throw new NotFoundException(`Residence ${dto.residence} not found`);
    if (residence.status === 'SOLD') {
      throw new BadRequestException(
        `Residence ${dto.residence} is already sold, please choose another one`,
      );
    }

    await this.prisma.enquiry.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email.toLowerCase(),
        comment: dto.comment ?? '',
        residenceId: residence.id,
        locale: dto.locale ?? 'EN',
        currency: dto.currency ?? 'USD',
        source: dto.source ?? ENQUIRY_SOURCES[0],
        activity: {
          create: {
            type: 'ENQUIRY_RECEIVED',
            note: `Enquiry received from the site, residence ${dto.residence} is ${statusLabel(residence.status)}, status not changed`,
          },
        },
      },
      select: { id: true },
    });
    return receipt;
  }
}

function statusLabel(status: ResidenceStatus): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}
