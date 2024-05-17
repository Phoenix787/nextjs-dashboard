'use server';

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const FormSchema = z.object({
	id: z.string(),
	customerId: z.string({
		invalid_type_error: 'Please select a customer',
	}),
	amount: z.coerce.number().gt(0, {
		message: 'Please enter an amount greater than 0',
	}),
	status: z.enum(['pending', 'paid'], {
		invalid_type_error: 'Please select an invoice status',
	}),
	date: z.string()
});

export type State = {
	errors?: {
		customerId?: string[];
		amount?: string[];
		status?: string[];
	};
	message?: string | null;
}

const CreateInvoice = FormSchema.omit({ id: true, date: true })

export async function createInvoice(prevState: State, formData: FormData) {
	const validatedFields = CreateInvoice.safeParse({
		customerId: formData.get('customerId'),
		amount: formData.get('amount'),
		status: formData.get('status'),
	});

	if (!validatedFields.success) {
		return {
			errors: validatedFields.error.flatten().fieldErrors,
			message: 'Missing Fields. Failed to create invoice'
		}
	}

	const { customerId, amount, status } = validatedFields.data;
	const amountToCents = amount * 100;
	const date = new Date().toISOString().split('T')[0];

	try {
		//inserting data into database
		await sql`
		INSERT INTO invoices (customer_id, amount, status, date)
		VALUES (${customerId}, ${amountToCents}, ${status}, ${date})`;
	} catch (error) {
		return { message: 'Database Error: Failed to create invoice' };

	}
	//update cache
	revalidatePath('/dashboard/invoices');
	redirect('/dashboard/invoices');
}

//If you're working with forms that have many fields, you may want to consider using the entries() method with JavaScript's Object.fromEntries(). For example: const rawFormData = Object.fromEntries(formData.entries())


//хорошая практика хранить денежные единицы и копейках или центах в базе данных, чтобы избежать проблем с плавающей запятой и точностью для вычислений


const UpdateInvoice = FormSchema.omit({ id: true, date: true })

export async function updateInvoice(id: string, prevState: State, formData: FormData) {
	const validatedFields = UpdateInvoice.safeParse({
		customerId: formData.get('customerId'),
		amount: formData.get('amount'),
		status: formData.get('status'),
	});
	if (!validatedFields.success) {
		return {
			errors: validatedFields.error.flatten().fieldErrors,
			message: 'Missing Fields. Failed to update invoice'
		}
	}

	const { customerId, amount, status } = validatedFields.data;

	const amountToCents = amount * 100;

	try {
		await sql`
		UPDATE invoices
		SET customer_id = ${customerId}, amount = ${amountToCents}, status = ${status}
		WHERE id = ${id}`;

	} catch (error) {
		return { message: 'Database Error: Failed to update invoice' };
	}
	//update cache
	revalidatePath('/dashboard/invoices');

	redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
	try {
		await sql`DELETE FROM invoices WHERE id = ${id}`;
		revalidatePath('/dashboard/invoices');
		return { message: 'Invoice deleted successfully' };
	} catch (error) {
		return { message: 'Database Error: Failed to delete invoice' }
	}
}