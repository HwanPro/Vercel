// types/email-existence.d.ts

declare module "email-existence" {
    // Ajusta los tipos según la firma real
    function check(
      email: string,
      callback: (err: any, res: boolean) => void
    ): void;
  
    export = {
      check,
    };
  }
  