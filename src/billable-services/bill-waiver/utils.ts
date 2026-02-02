import { type OpenmrsResource } from '@openmrs/esm-framework';
import type { LineItem, MappedBill, PaymentPayload } from '../../types';

export const createBillWaiverPayload = (
  bill: MappedBill,
  amountWaived: number,
  lineItems: Array<LineItem>,
  billableLineItems: Array<OpenmrsResource>,
  waiverBillableServiceUuid: string,
) => {
  const { cashier } = bill;

  const processedLineItems = lineItems.map((lineItem) => ({
    ...lineItem,
    billableService: findBillableServiceUuid(billableLineItems, lineItem),
  }));

  const waiverLineItem: LineItem | null =
    amountWaived > 0
      ? {
          quantity: 1,
          price: parseFloat((-Math.abs(amountWaived)).toFixed(2)),
          lineItemOrder: 0,
          paymentStatus: 'PAID',
          billableService: waiverBillableServiceUuid,
        }
      : null;

  // Transform existing payments to PaymentPayload format
  const existingPayments: PaymentPayload[] = bill.payments.map((payment) => ({
    amount: payment.amount,
    amountTendered: payment.amountTendered,
    attributes: payment.attributes,
    instanceType: payment.instanceType.uuid,
    dateCreated: payment.dateCreated,
  }));

  const processedPayment = {
    cashPoint: bill.cashPointUuid,
    cashier: cashier.uuid,
    lineItems: waiverLineItem ? [...processedLineItems, waiverLineItem] : processedLineItems,
    payments: [...existingPayments],
    patient: bill.patientUuid,
  };

  return processedPayment;
};

const findBillableServiceUuid = (billableService: Array<OpenmrsResource>, lineItems: LineItem) => {
  return billableService.find((service) => service.name === lineItems.billableService)?.uuid ?? null;
};
