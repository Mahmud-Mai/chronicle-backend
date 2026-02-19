import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, Patch } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SessionGuard } from '../../auth/guards/session.guard';
import { IntentionsService } from './intentions.service';
import { CreateIntentionDto, UpdateIntentionDto, IntentionQueryDto } from './dto/intention.dto';

@ApiTags('Intentions')
@ApiBearerAuth()
@UseGuards(SessionGuard)
@Controller('intentions')
export class IntentionsController {
  constructor(private readonly intentionsService: IntentionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new intention' })
  create(@Request() req: { user: { id: string } }, @Body() dto: CreateIntentionDto) {
    return this.intentionsService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all intentions with pagination' })
  findAll(@Request() req: { user: { id: string } }, @Query() query: IntentionQueryDto) {
    return this.intentionsService.findAll(req.user.id, query);
  }

  @Get('today')
  @ApiOperation({ summary: "Get today's intentions" })
  getToday(@Request() req: { user: { id: string } }) {
    return this.intentionsService.getToday(req.user.id);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming intentions' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  getUpcoming(@Request() req: { user: { id: string } }, @Query('days') days?: string) {
    return this.intentionsService.getUpcoming(req.user.id, days ? parseInt(days, 10) : 7);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single intention' })
  findOne(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.intentionsService.findOne(req.user.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an intention' })
  update(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: UpdateIntentionDto,
  ) {
    return this.intentionsService.update(req.user.id, id, dto);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Toggle intention completion status' })
  toggleComplete(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.intentionsService.toggleComplete(req.user.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an intention' })
  delete(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.intentionsService.delete(req.user.id, id);
  }
}
