// This mock hook simulates a successfully logged-in user session
// and ensures a non-null user object is always returned, bypassing any
// database dependency and fixing the "null (reading 'user_id')" error.

interface User {
  user_id: string;
  email: string;
  isLoggedIn: boolean;
}

const mockUser: User = {
  // CRITICAL FIX: This property prevents the crash in Home.tsx.
  user_id: "SIMULATED_USER_12345", 
  email: "mock_user@valuescout.com",
  isLoggedIn: true,
};

const useAuth = () => {
  // In a real application, this would manage state and context.
  // For now, we return a mock user instantly.
  return {
    user: mockUser,
    isAuthenticated: true,
    isLoading: false,
    // Placeholder functions to satisfy any component that calls them
    login: () => console.log("Mock login executed"),
    logout: () => console.log("Mock logout executed"),
  };
};

export default useAuth;