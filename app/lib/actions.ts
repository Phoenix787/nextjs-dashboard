'use server';

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const FormSchema = z.object({
	id: z.string(),
	customerId: z.string(),
	amount: z.coerce.number(),
	status: z.enum(['pending', 'paid']),
	date: z.string()
});

const CreateInvoice = FormSchema.omit({ id: true, date: true })

export async function createInvoice(formData: FormData) {
	const { customerId, amount, status } = CreateInvoice.parse({
		customerId: formData.get('customerId'),
		amount: formData.get('amount'),
		status: formData.get('status'),
	});
	const amountToCents = amount * 100;
	const date = new Date().toISOString().split('T')[0];
	//inserting data into database
	await sql`
	INSERT INTO invoices (customer_id, amount, status, date)
	VALUES (${customerId}, ${amountToCents}, ${status}, ${date})`;

	//update cache
	revalidatePath('/dashboard/invoices');
	redirect('/dashboard/invoices');
}

//If you're working with forms that have many fields, you may want to consider using the entries() method with JavaScript's Object.fromEntries(). For example: const rawFormData = Object.fromEntries(formData.entries())


//хорошая практика хранить денежные единицы и копейках или центах в базе данных, чтобы избежать проблем с плавающей запятой и точностью для вычислений


const UpdateInvoice = FormSchema.omit({ id: true, date: true })

export async function updateInvoice(id: string, formData: FormData) {
	const { customerId, amount, status } = UpdateInvoice.parse({
		customerId: formData.get('customerId'),
		amount: formData.get('amount'),
		status: formData.get('status'),
	});

	const amountToCents = amount * 100;

	await sql`
	UPDATE invoices
	SET customer_id = ${customerId}, amount = ${amountToCents}, status = ${status}
	WHERE id = ${id}`;

	//update cache
	revalidatePath('/dashboard/invoices');

	redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
	await sql`DELETE FROM invoices WHERE id = ${id}`;
	revalidatePath('/dashboard/invoices');
}