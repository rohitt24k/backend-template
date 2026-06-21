import { Types } from "mongoose";

export type T_MongoId = Types.ObjectId;

export type T_MongoDoc = {
  _id: T_MongoId;
  createdAt: Date;
  updatedAt: Date;
};
