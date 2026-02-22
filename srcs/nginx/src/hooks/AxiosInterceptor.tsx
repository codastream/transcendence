import { HTTP_STATUS } from '@transcendence/core';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api-client';

// TODO refresh du token JWT
export const AxiosInterceptor = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.statusCode === HTTP_STATUS.UNAUTHORIZED) {
          navigate('/welcome');
        }
        return Promise.reject(error);
      },
    );

    return () => api.interceptors.response.eject(interceptor);
  }, [navigate]);

  return <>{children}</>;
};
