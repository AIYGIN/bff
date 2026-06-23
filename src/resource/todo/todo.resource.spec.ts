import {
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import type { AppSupabaseClient } from "../../common/supabase/supabase.client";
import type { TodoEntity } from "../../entity/todo.entity";
import { TodoResource } from "./todo.resource";

type SupabaseResult<T> = {
  data: T | null;
  error: { code?: string; message: string } | null;
};

type QueryChain = {
  delete: jest.Mock<QueryChain, []>;
  eq: jest.Mock<QueryChain, [string, string | boolean]>;
  insert: jest.Mock<QueryChain, [object]>;
  maybeSingle: jest.Mock<Promise<SupabaseResult<unknown>>, []>;
  order: jest.Mock<Promise<SupabaseResult<unknown>>, [string, object]>;
  select: jest.Mock<QueryChain, [string]>;
  single: jest.Mock<Promise<SupabaseResult<unknown>>, []>;
  update: jest.Mock<QueryChain, [object]>;
};

const createQueryChain = <T>(result: SupabaseResult<T>): QueryChain => {
  const chain = {
    delete: jest.fn(),
    eq: jest.fn(),
    insert: jest.fn(),
    maybeSingle: jest.fn(),
    order: jest.fn(),
    select: jest.fn(),
    single: jest.fn(),
    update: jest.fn(),
  } as QueryChain;

  chain.delete.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.insert.mockReturnValue(chain);
  chain.maybeSingle.mockResolvedValue(result);
  chain.order.mockResolvedValue(result);
  chain.select.mockReturnValue(chain);
  chain.single.mockResolvedValue(result);
  chain.update.mockReturnValue(chain);

  return chain;
};

describe("TodoResource", () => {
  const ownerUserId = "usr_v1_1234567890123456789012345678901234567890123";
  const todoEntity: TodoEntity = {
    id: "9d1e7289-8f11-4e3e-9cf9-f735e7ee54c0",
    owner_user_id: ownerUserId,
    title: "請求書を確認する",
    completed: false,
    created_at: "2026-06-05T02:00:00+00:00",
    updated_at: "2026-06-05T02:00:00+00:00",
  };

  const createResource = (chain: QueryChain): TodoResource => {
    const supabase = {
      from: jest.fn().mockReturnValue(chain),
    } as unknown as AppSupabaseClient;
    return new TodoResource(supabase);
  };

  it("fetches authenticated user's TODOs ordered by newest created_at", async () => {
    const chain = createQueryChain({ data: [todoEntity], error: null });
    const resource = createResource(chain);

    await expect(resource.findManyByOwner(ownerUserId)).resolves.toEqual([
      todoEntity,
    ]);
    expect(chain.eq).toHaveBeenCalledWith("owner_user_id", ownerUserId);
    expect(chain.order).toHaveBeenCalledWith("created_at", {
      ascending: false,
    });
  });

  it("fetches one TODO by id and owner", async () => {
    const chain = createQueryChain({ data: todoEntity, error: null });
    const resource = createResource(chain);

    await expect(
      resource.findByIdForOwner(todoEntity.id, ownerUserId),
    ).resolves.toBe(todoEntity);
    expect(chain.eq).toHaveBeenCalledWith("owner_user_id", ownerUserId);
    expect(chain.eq).toHaveBeenCalledWith("id", todoEntity.id);
  });

  it("creates a TODO with owner_user_id from the authenticated user", async () => {
    const chain = createQueryChain({ data: todoEntity, error: null });
    const resource = createResource(chain);

    await expect(
      resource.create({ ownerUserId, title: todoEntity.title }),
    ).resolves.toBe(todoEntity);
    expect(chain.insert).toHaveBeenCalledWith({
      owner_user_id: ownerUserId,
      title: todoEntity.title,
    });
  });

  it("updates completed only for the authenticated owner", async () => {
    const chain = createQueryChain({
      data: { ...todoEntity, completed: true },
      error: null,
    });
    const resource = createResource(chain);

    await expect(
      resource.updateCompletedByIdForOwner({
        id: todoEntity.id,
        ownerUserId,
        completed: true,
      }),
    ).resolves.toEqual({ ...todoEntity, completed: true });
    expect(chain.update).toHaveBeenCalledWith({
      completed: true,
      updated_at: expect.any(String),
    });
    expect(chain.eq).toHaveBeenCalledWith("owner_user_id", ownerUserId);
    expect(chain.eq).toHaveBeenCalledWith("id", todoEntity.id);
  });

  it("deletes only a TODO owned by the authenticated user", async () => {
    const chain = createQueryChain({
      data: { id: todoEntity.id },
      error: null,
    });
    const resource = createResource(chain);

    await expect(
      resource.deleteByIdForOwner(todoEntity.id, ownerUserId),
    ).resolves.toBe(true);
    expect(chain.eq).toHaveBeenCalledWith("owner_user_id", ownerUserId);
    expect(chain.eq).toHaveBeenCalledWith("id", todoEntity.id);
  });

  it("returns false when delete target is missing or owned by another user", async () => {
    const chain = createQueryChain({ data: null, error: null });
    const resource = createResource(chain);

    await expect(
      resource.deleteByIdForOwner(todoEntity.id, ownerUserId),
    ).resolves.toBe(false);
  });

  it("maps Supabase constraint errors to BadRequest without exposing details", async () => {
    const chain = createQueryChain({
      data: null,
      error: {
        code: "23514",
        message: "new row violates check constraint with service role details",
      },
    });
    const resource = createResource(chain);

    await expect(
      resource.create({ ownerUserId, title: "" }),
    ).rejects.toThrow(BadRequestException);
  });

  it("maps unexpected Supabase errors to generic InternalServerError", async () => {
    const chain = createQueryChain({
      data: null,
      error: {
        code: "08006",
        message: "connection failed with secret details",
      },
    });
    const resource = createResource(chain);

    await expect(resource.findManyByOwner(ownerUserId)).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
