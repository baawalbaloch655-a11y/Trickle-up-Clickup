import { Module } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { RealtimeModule } from '../../realtime/realtime.module';

@Module({
    imports: [RealtimeModule],
    controllers: [EmployeesController],
    providers: [EmployeesService],
    exports: [EmployeesService]
})
export class EmployeesModule { }
