import { transactionQuerySchema } from './src/schemas/transaction.schema';

const result = transactionQuerySchema.safeParse({});
console.log(result);
