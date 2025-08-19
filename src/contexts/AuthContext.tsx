import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { trpc } from '../utils/trpc';

interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isAdmin: boolean | null;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean };

interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  isLoading: true,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  
  const loginMutation = trpc.auth.login.useMutation();
  const registerMutation = trpc.auth.register.useMutation();
  const verifyTokenQuery = trpc.auth.verifyToken.useQuery(
    { token: state.token || '' },
    { 
      enabled: !!state.token,
      retry: false,
    }
  );

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // Token verification will be handled by the query
      dispatch({ type: 'SET_LOADING', payload: false });
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Handle token verification result
  useEffect(() => {
    if (verifyTokenQuery.data) {
      if (verifyTokenQuery.data.valid && verifyTokenQuery.data.user) {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: verifyTokenQuery.data.user,
            token: state.token || '',
          },
        });
      } else {
        // Invalid token, clear it
        localStorage.removeItem('authToken');
        dispatch({ type: 'LOGOUT' });
      }
    }
  }, [verifyTokenQuery.data, state.token]);

  const login = async (email: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const result = await loginMutation.mutateAsync({ email, password });
      
      if (result.success) {
        localStorage.setItem('authToken', result.token);
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: result.user,
            token: result.token,
          },
        });
        return { success: true, message: result.message };
      } else {
        dispatch({ type: 'LOGIN_FAILURE' });
        return { success: false, message: 'Ошибка входа' };
      }
    } catch (error: any) {
      dispatch({ type: 'LOGIN_FAILURE' });
      return { success: false, message: error.message || 'Ошибка входа' };
    }
  };

  const register = async (data: RegisterData) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const result = await registerMutation.mutateAsync(data);
      
      if (result.success) {
        localStorage.setItem('authToken', result.token);
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: result.user,
            token: result.token,
          },
        });
        return { success: true, message: result.message };
      } else {
        dispatch({ type: 'LOGIN_FAILURE' });
        return { success: false, message: 'Ошибка регистрации' };
      }
    } catch (error: any) {
      dispatch({ type: 'LOGIN_FAILURE' });
      return { success: false, message: error.message || 'Ошибка регистрации' };
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider
      value={{
        state,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}