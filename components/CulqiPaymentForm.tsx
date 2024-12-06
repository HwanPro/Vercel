"use client";

import React, { forwardRef } from "react";

type CulqiPaymentFormProps = {
  onSuccess: (charge: any) => void;
  onError: (error: string) => void;
};

export default forwardRef(function CulqiPaymentForm(
  { onSuccess }: CulqiPaymentFormProps,
  ref
) {
  const simulatePayment = () => {
    const simulatedCharge = {
      id: "simulated_charge_id",
      amount: 6000,
      currency: "PEN",
      description: "Pago simulado",
    };
    onSuccess(simulatedCharge);
  };

  return (
    <div>
      <button onClick={simulatePayment}>
        Simular Pago
      </button>
    </div>
  );
});
