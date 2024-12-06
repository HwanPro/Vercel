import { Button } from "@/components/ui/button";

export default function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center w-96">
        <p className="text-lg mb-4 text-black">{message}</p>
        <div className="flex justify-between">
          <Button
            className="bg-red-500 text-white hover:bg-red-600 w-24"
            onClick={onConfirm}
          >
            Aceptar
          </Button>
          <Button
            className="bg-gray-300 text-black hover:bg-gray-400 w-24"
            onClick={onCancel}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
