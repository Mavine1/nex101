import express from 'express';
import { clerkMiddleware } from '@clerk/express';
import { 
  getInvoices, 
  createInvoice, 
  updateInvoice, 
  deleteInvoice 
} from '../controllers/invoiceController.js';  // Added one dot (../)

const invoiceRouter = express.Router();

invoiceRouter.use(clerkMiddleware());

invoiceRouter.get('/', getInvoices);
invoiceRouter.post('/', createInvoice);
invoiceRouter.put('/:id', updateInvoice);
invoiceRouter.delete('/:id', deleteInvoice);

export default invoiceRouter;