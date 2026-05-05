import { transactionQuerySchema } from './src/schemas/transaction.schema';

console.log("Search test: ", transactionQuerySchema.safeParse({ search: 'salary' }));
