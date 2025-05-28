import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  password: string; // hashed

  @Prop({ type: Date, default: null })
  tokenInvalidBefore: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
