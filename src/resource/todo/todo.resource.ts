import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import {
  type AppSupabaseClient,
  SUPABASE_CLIENT,
} from "../../common/supabase/supabase.client";
import type { TodoEntity } from "../../entity/todo.entity";

const TODO_COLUMNS =
  "id, owner_user_id, title, completed, created_at, updated_at";

type SupabaseError = {
  code?: string;
  message: string;
};

type CreateTodoInput = {
  ownerUserId: string;
  title: string;
};

type UpdateTodoCompletedInput = {
  id: string;
  ownerUserId: string;
  completed: boolean;
};

@Injectable()
export class TodoResource {
  constructor(
    @Inject(SUPABASE_CLIENT)
    private readonly supabase: AppSupabaseClient,
  ) {}

  async findManyByOwner(ownerUserId: string): Promise<TodoEntity[]> {
    const { data, error } = await this.supabase
      .from("todos")
      .select(TODO_COLUMNS)
      .eq("owner_user_id", ownerUserId)
      .order("created_at", { ascending: false });

    this.throwIfError(error);
    return data ?? [];
  }

  async findByIdForOwner(
    id: string,
    ownerUserId: string,
  ): Promise<TodoEntity | null> {
    const { data, error } = await this.supabase
      .from("todos")
      .select(TODO_COLUMNS)
      .eq("owner_user_id", ownerUserId)
      .eq("id", id)
      .maybeSingle();

    this.throwIfError(error);
    return data;
  }

  async create(input: CreateTodoInput): Promise<TodoEntity> {
    const { data, error } = await this.supabase
      .from("todos")
      .insert({
        owner_user_id: input.ownerUserId,
        title: input.title,
      })
      .select(TODO_COLUMNS)
      .single();

    this.throwIfError(error);
    if (data === null) {
      throw new InternalServerErrorException("Todo creation failed");
    }
    return data;
  }

  async updateCompletedByIdForOwner(
    input: UpdateTodoCompletedInput,
  ): Promise<TodoEntity | null> {
    const { data, error } = await this.supabase
      .from("todos")
      .update({
        completed: input.completed,
        updated_at: new Date().toISOString(),
      })
      .eq("owner_user_id", input.ownerUserId)
      .eq("id", input.id)
      .select(TODO_COLUMNS)
      .maybeSingle();

    this.throwIfError(error);
    return data;
  }

  async deleteByIdForOwner(
    id: string,
    ownerUserId: string,
  ): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("todos")
      .delete()
      .eq("owner_user_id", ownerUserId)
      .eq("id", id)
      .select("id")
      .maybeSingle();

    this.throwIfError(error);
    return data !== null;
  }

  private throwIfError(error: SupabaseError | null): void {
    if (error === null) {
      return;
    }
    if (error.code === "23514" || error.code === "22P02") {
      throw new BadRequestException("Invalid TODO request");
    }
    throw new InternalServerErrorException("Todo persistence failed");
  }
}
