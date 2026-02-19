import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SessionGuard } from '../../auth/guards/session.guard';
import { EntriesService } from './entries.service';
import { CreateEntryDto, UpdateEntryDto, EntryQueryDto } from './dto/entry.dto';

@ApiTags('Entries')
@ApiBearerAuth()
@UseGuards(SessionGuard)
@Controller('entries')
export class EntriesController {
  constructor(private readonly entriesService: EntriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new entry' })
  create(@Request() req: { user: { id: string } }, @Body() dto: CreateEntryDto) {
    return this.entriesService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all entries with pagination' })
  findAll(@Request() req: { user: { id: string } }, @Query() query: EntryQueryDto) {
    return this.entriesService.findAll(req.user.id, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get entry statistics' })
  getStats(
    @Request() req: { user: { id: string } },
    @Query('activityId') activityId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.entriesService.getStats(
      req.user.id,
      activityId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single entry' })
  findOne(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.entriesService.findOne(req.user.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an entry' })
  update(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: UpdateEntryDto,
  ) {
    return this.entriesService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an entry' })
  delete(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.entriesService.delete(req.user.id, id);
  }
}
