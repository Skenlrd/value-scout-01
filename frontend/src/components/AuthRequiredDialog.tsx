import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AuthRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
}

const AuthRequiredDialog = ({ 
  open, 
  onOpenChange,
  feature = "this feature"
}: AuthRequiredDialogProps) => {
  const navigate = useNavigate();

  const handleLogin = () => {
    onOpenChange(false);
    navigate("/login");
  };

  const handleRegister = () => {
    onOpenChange(false);
    navigate("/register");
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-bold text-gray-900">
            Login Required
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-700 text-base">
            You need to be logged in to use {feature}. Create an account or login to continue.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-3">
          <AlertDialogCancel className="bg-gray-200 hover:bg-gray-300 text-gray-900">
            Cancel
          </AlertDialogCancel>
          <button
            onClick={handleRegister}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium transition-colors"
          >
            Register
          </button>
          <AlertDialogAction
            onClick={handleLogin}
            className="bg-black hover:bg-gray-800 text-white"
          >
            Login
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AuthRequiredDialog;
