import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CreateBusinessAddressPayload = {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zip: string;
    complement?: string | null;
};

type CreateBusinessPayload = {
    name: string;
    description: string;
    phoneCommercial: string;
    mobileCommercial?: string | null;
    emailCommercial: string;
    address: CreateBusinessAddressPayload;
};

function badRequest(message: string) {
    return NextResponse.json(
        { error: "bad_request", message },
        { status: 400 }
    );
}

function conflict(message: string) {
    return NextResponse.json(
        { error: "conflict", message },
        { status: 409 }
    );
}

function unauthorized() {
    return NextResponse.json(
        { error: "unauthorized", message: "Usuário não autenticado." },
        { status: 401 }
    );
}

function internalError(message = "Erro interno ao criar o negócio.") {
    return NextResponse.json(
        { error: "internal_error", message },
        { status: 500 }
    );
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

function validatePayload(body: unknown): CreateBusinessPayload | null {
    if (typeof body !== "object" || body === null) {
        return null;
    }

    const {
        name,
        description,
        phoneCommercial,
        mobileCommercial,
        emailCommercial,
        address,
    } = body as Record<string, unknown>;

    if (!isNonEmptyString(name)) return null;
    if (!isNonEmptyString(description)) return null;
    if (!isNonEmptyString(phoneCommercial)) return null;
    if (!isNonEmptyString(emailCommercial)) return null;

    if (typeof address !== "object" || address === null) return null;

    const {
        street,
        number,
        neighborhood,
        city,
        state,
        zip,
        complement,
    } = address as Record<string, unknown>;

    if (!isNonEmptyString(street)) return null;
    if (!isNonEmptyString(number)) return null;
    if (!isNonEmptyString(neighborhood)) return null;
    if (!isNonEmptyString(city)) return null;
    if (!isNonEmptyString(state)) return null;
    if (!isNonEmptyString(zip)) return null;

    return {
        name,
        description,
        phoneCommercial,
        mobileCommercial:
            typeof mobileCommercial === "string" && mobileCommercial.trim().length > 0
                ? mobileCommercial
                : null,
        emailCommercial,
        address: {
            street,
            number,
            neighborhood,
            city,
            state,
            zip,
            complement:
                typeof complement === "string" && complement.trim().length > 0
                    ? complement
                    : null,
        },
    };
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();

        // 1) Obter usuário autenticado
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return unauthorized();
        }

        // 2) Obter account do usuário para descobrir o tenant_id
        const {
            data: account,
            error: accountError,
        } = await supabase
            .from("accounts")
            .select("tenant_id")
            .eq("user_id", user.id)
            .maybeSingle();

        if (accountError) {
            console.error("Erro ao buscar account do usuário:", accountError);
            return internalError("Falha ao buscar a conta do usuário.");
        }

        if (!account) {
            return badRequest(
                "Conta do usuário não encontrada. Não é possível criar um negócio sem conta vinculada."
            );
        }

        const tenantId = account.tenant_id as string | null;

        if (!tenantId) {
            return badRequest(
                "Conta do usuário não possui tenant_id definido. Não é possível criar um negócio."
            );
        }

        // 3) Validar payload
        let body: unknown;
        try {
            body = await req.json();
        } catch (err) {
            console.error("Erro ao fazer parse do JSON:", err);
            return badRequest("Corpo da requisição deve ser um JSON válido.");
        }

        const payload = validatePayload(body);

        if (!payload) {
            return badRequest(
                "Payload inválido. Verifique campos obrigatórios do negócio e do endereço."
            );
        }

        // 4) Verificar se já existe business para este tenant
        const {
            data: existingBusiness,
            error: existingError,
        } = await supabase
            .from("business")
            .select("id")
            .eq("tenant_id", tenantId)
            .maybeSingle();

        if (existingError) {
            console.error("Erro ao verificar existência de business:", existingError);
            return internalError("Falha ao verificar se o negócio já existe.");
        }

        if (existingBusiness) {
            return conflict("Já existe um negócio cadastrado para este tenant.");
        }

        // 5) Inserir novo business (status draft por padrão)
        const {
            data: createdBusiness,
            error: insertError,
        } = await supabase
            .from("business")
            .insert({
                tenant_id: tenantId,
                name: payload.name,
                description: payload.description,
                phone_commercial: payload.phoneCommercial,
                mobile_commercial: payload.mobileCommercial,
                email_commercial: payload.emailCommercial,
                address_street: payload.address.street,
                address_number: payload.address.number,
                address_neighborhood: payload.address.neighborhood,
                address_city: payload.address.city,
                address_state: payload.address.state,
                address_zip: payload.address.zip,
                address_complement: payload.address.complement,
            })
            .select(
                "id, tenant_id, status, name, email_commercial, created_at, updated_at"
            )
            .single();

        if (insertError || !createdBusiness) {
            console.error("Erro ao inserir business:", insertError);
            return internalError("Falha ao criar o negócio.");
        }

        return NextResponse.json(
            {
                id: createdBusiness.id,
                tenantId: createdBusiness.tenant_id,
                status: createdBusiness.status,
                name: createdBusiness.name,
                emailCommercial: createdBusiness.email_commercial,
                createdAt: createdBusiness.created_at,
                updatedAt: createdBusiness.updated_at,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Erro inesperado no POST /api/business:", error);
        return internalError();
    }
}
