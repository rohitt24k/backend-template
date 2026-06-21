---
name: backend-codegen
description: >
  Generates all backend files for a new resource/entity in the project.
  Use this skill whenever a user asks to generate, scaffold, create, or add a new
  resource, entity, model, or endpoint in the backend. Also use it when
  the user says things like "add [entity] to the backend", "build the [entity] API",
  or "create CRUD for [entity]". Always use this skill for any backend
  code generation — do not freestyle the structure.
---

# Backend Codegen Skill

## What this skill does

Scaffolds all 6 files for a new resource in the backend. Every resource
follows the same structure, in the same order, with no deviations. When in doubt
about a field, relationship, or business rule, **stop and ask** — do not guess.

---

## Stack

- Node.js + TypeScript + Express
- MongoDB via Mongoose
- Zod for validation
- JWT auth via existing middleware (never regenerate)

---

## Output: always exactly 6 files in this order

```
[entity].schema.ts
[entity].dto.ts
[entity].model.ts
[entity].route.ts
[entity].service.ts
[entity].controller.ts
```

Never combine files. Never skip a file. Never add extra files unless explicitly asked.

---

## File 1 — `[entity].schema.ts`

**Purpose:** All Zod validation schemas for this entity. This is the source of truth for field shapes — the DTO infers types from here.

Rules:

- Export a `[Entity]Schema` that reflects the full DB document shape (with ObjectId `.transform` for FK fields)
- Export a `Create[Entity]Schema` for POST body — no `.transform` on FK fields (leave them as validated strings), omit server-set fields like `isActive`
- Export an `Update[Entity]Schema` for PATCH body — typically `.partial()` or manually `.optional()` each field
- Export a `[Entity]QuerySchema` extending `PaginationSchema` for list query params
- Use `objectIdFieldSchema` for all ObjectId references
- Use `z.preprocess` for boolean coercion in query params: `(val) => (val === "true" ? true : val === "false" ? false : val)`
- Enums come from constants files, never inline: `import { SlotEnum } from "../constants/slots"`
- Extract shared field factories (e.g. `boolField`, `tagsField`) as local `const` when the same preprocessing is needed in multiple schemas

```ts
import z from "zod";
import { objectIdFieldSchema, PaginationSchema } from "./common.schema";
import { Types } from "mongoose";

// [Entity]Schema = full DB document shape (FK fields transformed to ObjectId)
export const [Entity]Schema = z.object({
  name: z.string().min(1),
  relatedEntity: objectIdFieldSchema.transform((val) => new Types.ObjectId(val)),
  isActive: z.boolean().default(true),
});

// Create: raw string ObjectIds, omit server-set fields
export const Create[Entity]Schema = z.object({
  name: z.string().min(1),
  relatedEntity: objectIdFieldSchema,
});

// Update: all fields optional
export const Update[Entity]Schema = z.object({
  name: z.string().min(1).optional(),
  relatedEntity: objectIdFieldSchema.optional(),
  isActive: z.preprocess(
    (val) => (val === "true" ? true : val === "false" ? false : val),
    z.boolean().optional(),
  ),
});

export const [Entity]QuerySchema = PaginationSchema.extend({
  isActive: z.preprocess(
    (val) => (val === "true" ? true : val === "false" ? false : val),
    z.boolean().optional(),
  ),
});
```

---

## File 2 — `[entity].dto.ts`

**Purpose:** All TypeScript types for this entity, inferred from the schemas.

Rules:

- Import `[Entity]Schema`, `Create[Entity]Schema`, `Update[Entity]Schema`, `[Entity]QuerySchema` from the schema file
- Base type `type [Entity]` is inferred directly: `z.infer<typeof [Entity]Schema>`
- Full document type: `export type [Entity]Dto = [Entity] & T_MongoDoc`
- Derived create type: `export type Create[Entity]Dto = Omit<[Entity]Dto, "_id" | "createdAt" | "updatedAt">`
- Schema-inferred types for each operation (used for request handling): `Create[Entity]SchemaDto`, `Update[Entity]SchemaDto`, `[Entity]QuerySchemaDto`
- No enum definitions here — enums live in `/constants/`
- No `T_MongoId` import unless needed directly (types come from schema inference)

```ts
import z from "zod";
import { T_MongoDoc } from "../types/common.types";
import {
  [Entity]Schema,
  Create[Entity]Schema,
  Update[Entity]Schema,
  [Entity]QuerySchema,
} from "../schemas/[entity].schema";

type [Entity] = z.infer<typeof [Entity]Schema>;

export type [Entity]Dto = [Entity] & T_MongoDoc;
export type Create[Entity]Dto = Omit<[Entity]Dto, "_id" | "createdAt" | "updatedAt">;

export type Create[Entity]SchemaDto = z.infer<typeof Create[Entity]Schema>;
export type Update[Entity]SchemaDto = z.infer<typeof Update[Entity]Schema>;
export type [Entity]QuerySchemaDto = z.infer<typeof [Entity]QuerySchema>;
```

---

## File 3 — `[entity].model.ts`

**Purpose:** Mongoose schema and model definition.

Rules:

- Import `Schema, model` from mongoose and the `[Entity]Dto`
- Map every DTO field to its Mongoose type exactly
- ObjectId FK fields → `{ type: Schema.Types.ObjectId, ref: "[ReferencedEntity]" }`
- Array of ObjectIds → `[{ type: Schema.Types.ObjectId, ref: "[ReferencedEntity]" }]`
- Sensitive fields (e.g. `passwordHash`) → add `select: false`
- Always use `{ timestamps: true }` in schema options
- Add Mongoose indexes (e.g. `2dsphere`) after schema definition if needed
- Export: `export const [Entity] = model<[Entity]Dto>("[Entity]", [entity]Schema)`

```ts
import { Schema, model } from "mongoose";
import { [Entity]Dto } from "../dto/[entity].dto";

const [entity]Schema = new Schema<[Entity]Dto>(
  {
    name: { type: String, required: true, trim: true },
    relatedEntity: { type: Schema.Types.ObjectId, ref: "RelatedEntity", required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const [Entity] = model<[Entity]Dto>("[Entity]", [entity]Schema);
```

---

## File 4 — `[entity].route.ts`

**Purpose:** Express router — maps HTTP verbs + paths to middleware chains.

Rules:

- Use `express.Router()`, export as `[entity]Router` (camelCase)
- Auth is always **two** separate middlewares in sequence: `AuthenticationMiddleware` (no args) then `AuthorizationMiddleware(UserRoleEnum.ADMIN)`
- `zodMiddleware` (lowercase `z`) validates and writes parsed values to `res.locals`
- Standard chain for a protected mutation: `AuthenticationMiddleware` → `AuthorizationMiddleware(role)` → `zodMiddleware(...)` → `Controller.Action`
- For multipart/form-data routes (file upload): insert `upload.single("image")` between authorization and zodMiddleware
- GET routes are typically public (no auth) — omit both auth middlewares
- POST/PATCH routes require auth — include both auth middlewares
- Use `ObjectIDParamsSchema` for all `/:id` routes
- Roles imported from `"../constants/roles"`, never from `"../dto/user.dto"`
- Comment each route block with what it does and its visibility (Public / Admin)
- Never put logic in route files — only middleware chains

```ts
import { Router } from "express";
import { AuthenticationMiddleware } from "../middlewares/authentication.middleware";
import { AuthorizationMiddleware } from "../middlewares/authorization.middleware";
import { zodMiddleware } from "../middlewares/zod.middleware";
import { ObjectIDParamsSchema } from "../schemas/common.schema";
import { [Entity]Controller } from "../controllers/[entity].controller";
import {
  Create[Entity]Schema,
  Update[Entity]Schema,
  [Entity]QuerySchema,
} from "../schemas/[entity].schema";
import { UserRoleEnum } from "../constants/roles";

export const [entity]Router = Router();

// Public: list [entities]
[entity]Router.get(
  "/",
  zodMiddleware({ query: [Entity]QuerySchema }),
  [Entity]Controller.List,
);

// Public: get [entity] by ID
[entity]Router.get(
  "/:id",
  zodMiddleware({ params: ObjectIDParamsSchema }),
  [Entity]Controller.GetById,
);

// Admin: create [entity]
[entity]Router.post(
  "/",
  AuthenticationMiddleware,
  AuthorizationMiddleware(UserRoleEnum.ADMIN),
  zodMiddleware({ body: Create[Entity]Schema }),
  [Entity]Controller.Create,
);

// Admin: update [entity]
[entity]Router.patch(
  "/:id",
  AuthenticationMiddleware,
  AuthorizationMiddleware(UserRoleEnum.ADMIN),
  zodMiddleware({ params: ObjectIDParamsSchema, body: Update[Entity]Schema }),
  [Entity]Controller.Update,
);
```

---

## File 5 — `[entity].service.ts`

**Purpose:** All business logic. The only layer that touches the database.

Rules:

- Each exported function maps to exactly one controller action
- Always fetch the document before mutating — throw `new BadRequest(...)` if not found
- Use `new Conflict(...)` for uniqueness violations
- Mutate fields via `Object.assign(doc, data)` then `await doc.save()`; or mutate individually for selective updates
- Never use `findByIdAndUpdate` for mutations unless it's a targeted atomic operation (e.g. capacity decrement with `$inc`)
- For paginated lists:
  1. Build `QueryFilter<[Entity]Dto>`
  2. Apply `$regex` for `search` if provided
  3. Apply other filters from the typed query
  4. Define `sort` with `as const`
  5. `Promise.all([Model.find(filter).sort(sort).skip(...).limit(...).lean(), Model.countDocuments(filter)])`
  6. Return `Paginate(data, limit, page, count)`
- Query params that use `z.preprocess` need a type cast: `query as [Entity]QuerySchemaDto & { isActive?: boolean }`
- Errors are classes — always use `new`: `throw new BadRequest("message")`, `throw new Conflict("message")`
- Import `Paginate` from `"../utils/paginate.util"` (with `.util` suffix)

```ts
import { QueryFilter } from "mongoose";
import { BadRequest } from "../utils/errors";
import { Paginate } from "../utils/paginate.util";
import { [Entity] } from "../models/[entity].model";
import {
  [Entity]Dto,
  Create[Entity]SchemaDto,
  Update[Entity]SchemaDto,
  [Entity]QuerySchemaDto,
} from "../dto/[entity].dto";

export const Create[Entity]Service = async (data: Create[Entity]SchemaDto) => {
  const doc = new [Entity]({ ...data, isActive: true });
  await doc.save();
  return doc;
};

export const Get[Entity]ByIdService = async (id: string) => {
  const doc = await [Entity].findById(id);
  if (!doc) throw new BadRequest("[Entity] not found");
  return doc;
};

export const Update[Entity]Service = async (
  id: string,
  data: Update[Entity]SchemaDto,
) => {
  const doc = await [Entity].findById(id);
  if (!doc) throw new BadRequest("[Entity] not found");
  Object.assign(doc, data);
  await doc.save();
  return doc;
};

export const List[Entity]sService = async (query: [Entity]QuerySchemaDto) => {
  const { search, page, limit, isActive } = query as [Entity]QuerySchemaDto & {
    isActive?: boolean;
  };
  const filter: QueryFilter<[Entity]Dto> = {};
  if (search) filter.name = { $regex: search, $options: "i" };
  if (isActive !== undefined) filter.isActive = isActive;
  const sort = { createdAt: -1 } as const;
  const [data, count] = await Promise.all([
    [Entity].find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    [Entity].countDocuments(filter),
  ]);
  return Paginate(data, limit, page, count);
};
```

---

## File 6 — `[entity].controller.ts`

**Purpose:** HTTP layer. Reads request, calls service, sends response. No logic here.

Rules:

- Every handler: `(async (req, res, next) => { try { ... } catch (err) { next(err) } }) as RequestHandler`
- Read validated inputs from `res.locals` — **never** from `req.body`, `req.query`, or `req.params` directly
  - `res.locals.body as Create[Entity]SchemaDto`
  - `res.locals.query as [Entity]QuerySchemaDto`
  - `res.locals.params as ObjectIDParamsSchemaDto`
- Auth context from `res.locals.user`
- Always respond via `GenerateResponse(res, statusCode, data, "message")`
- Import `GenerateResponse` from `"../utils/response.creator"` (not `"../utils/response"`)
- `201` for creates, `200` for everything else
- Never put business logic or DB calls here

```ts
import { RequestHandler } from "express";
import { GenerateResponse } from "../utils/response.creator";
import {
  Create[Entity]Service,
  Get[Entity]ByIdService,
  Update[Entity]Service,
  List[Entity]sService,
} from "../services/[entity].service";
import {
  Create[Entity]SchemaDto,
  Update[Entity]SchemaDto,
  [Entity]QuerySchemaDto,
} from "../dto/[entity].dto";
import { ObjectIDParamsSchemaDto } from "../dto/common.dto";

export const [Entity]Controller = {
  Create: (async (req, res, next) => {
    try {
      const body = res.locals.body as Create[Entity]SchemaDto;
      const result = await Create[Entity]Service(body);
      GenerateResponse(res, 201, result, "[Entity] created");
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,

  GetById: (async (req, res, next) => {
    try {
      const { id } = res.locals.params as ObjectIDParamsSchemaDto;
      const result = await Get[Entity]ByIdService(id);
      GenerateResponse(res, 200, result, "[Entity] fetched");
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,

  Update: (async (req, res, next) => {
    try {
      const { id } = res.locals.params as ObjectIDParamsSchemaDto;
      const body = res.locals.body as Update[Entity]SchemaDto;
      const result = await Update[Entity]Service(id, body);
      GenerateResponse(res, 200, result, "[Entity] updated");
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,

  List: (async (req, res, next) => {
    try {
      const query = res.locals.query as [Entity]QuerySchemaDto;
      const result = await List[Entity]sService(query);
      GenerateResponse(res, 200, result, "[Entity]s fetched");
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,
};
```

---

## business rules to apply while generating

These must be reflected in the service layer automatically when relevant — do not wait to be told.

| Rule                                                                    | Where it applies                      |
| ----------------------------------------------------------------------- | ------------------------------------- |
| Slot names are always `"lunch"` or `"dinner"` — use `SlotEnum` constant | Any schema or service touching slots  |
| Order cutoff = 48h before slot start                                    | Order service — validate at placement |
| Refund cutoff = 24h before slot start                                   | Cancellation service                  |
| Cancellation is always slot-level — never partial                       | Order cancellation service            |
| Capacity deducted atomically at order placement                         | Use `findOneAndUpdate` with `$inc`    |
| Capacity fully restored on any cancellation                             | Cancellation service                  |
| Snapshot `mealName` and `unitPrice` at order time                       | Order creation service                |
| All meals start at `status: "pending"` when an order is placed          | Order creation service                |

---

## What to ask before generating

Stop and ask if any of the following are true:

- The entity has a relationship or ownership scope that isn't clear from the schema doc
- A business rule listed above has an edge case not covered (e.g. re-assignment after pickup)
- The entity requires a cross-collection transaction and the right place to put it is ambiguous
- A new enum value or status is needed that isn't in the constants files yet
- It's unclear whether GET routes should be public or auth-protected

Do not make assumptions and generate. Ask first.

---

## What never to do

- Do not put DB queries in controllers
- Do not skip Zod validation on any mutation route
- Do not use `console.log` — use the project logger
- Do not hardcode strings — reference constants
- Do not regenerate `zodMiddleware`, `AuthenticationMiddleware`, or `AuthorizationMiddleware`
- Do not combine `AuthenticationMiddleware` and `AuthorizationMiddleware` — they are always separate
- Do not read `req.body`, `req.query`, or `req.params` in controllers — always read from `res.locals`
- Do not import roles from `"../dto/user.dto"` — import from `"../constants/roles"`
- Do not import `Paginate` without the `.util` suffix (`"../utils/paginate.util"`)
- Do not import `GenerateResponse` from `"../utils/response"` — use `"../utils/response.creator"`
- Do not throw errors without `new`: use `throw new BadRequest(...)` not `throw BadRequest(...)`
- Do not add extra files beyond the 6
