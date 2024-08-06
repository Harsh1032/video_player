import Form from '@components/Form';
import ProtectedRoute from '@components/ProtectedRoute';

export default function FormPage() {
  return (
    <ProtectedRoute>
      <Form />
    </ProtectedRoute>
  );
}
