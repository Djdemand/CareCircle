import { useNavigate } from 'react-router-dom';

export const useWebNavigation = () => {
  const navigate = useNavigate();

  return {
    navigate: (screen: string, params?: any) => {
      // Map navigation params to URL params if needed
      if (params) {
        const queryString = new URLSearchParams(params).toString();
        navigate(`${screen}?${queryString}`);
      } else {
        navigate(screen);
      }
    },
    goBack: () => navigate(-1),
    reset: (index: number, routes: { name: string; params?: any }[]) => {
      // For web, just navigate to the last route
      if (routes.length > 0) {
        const lastRoute = routes[routes.length - 1];
        navigate(lastRoute.name);
      }
    }
  };
};
