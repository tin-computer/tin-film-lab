import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {RouterProvider} from '@tanstack/react-router';
import {router} from './App';
import './styles.css';

const client=new QueryClient({defaultOptions:{queries:{staleTime:Infinity,retry:1,refetchOnWindowFocus:false},mutations:{retry:false}}});
createRoot(document.getElementById('root')!).render(<StrictMode><QueryClientProvider client={client}><RouterProvider router={router}/></QueryClientProvider></StrictMode>);
