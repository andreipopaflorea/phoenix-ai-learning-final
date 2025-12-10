import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const TestGeminiButton = () => {
  const [loading, setLoading] = useState(false);

  const testGemini = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-gemini');
      
      if (error) {
        console.error('Error calling Gemini:', error);
      } else {
        console.log('Gemini says:', data.message);
      }
    } catch (err) {
      console.error('Request failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={testGemini} 
      disabled={loading}
      className="fixed bottom-4 right-4 z-50"
    >
      {loading ? 'Testing...' : 'Test Gemini'}
    </Button>
  );
};

export default TestGeminiButton;
