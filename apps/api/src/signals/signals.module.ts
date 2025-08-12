import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { XRaySignal, XRaySignalSchema } from './xray/xray.schema';
import { XRayService } from './xray/xray.service';
import { XRayController } from './xray/xray.controller';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: XRaySignal.name, schema: XRaySignalSchema }]),
    ],
    controllers: [XRayController],
    providers: [XRayService],
    exports: [XRayService],
})
export class SignalsModule {}
