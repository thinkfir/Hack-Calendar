import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const createHackathon = async (hackathonData: { name: string; startDate: string; durationHours: number; projectIdea?: string }) => {
  const { data } = await api.post('/hackathons', hackathonData);
  return data;
};

const CreateHackathonForm = () => {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [durationHours, setDurationHours] = useState(48);
  const [projectIdea, setProjectIdea] = useState('');

  const mutation = useMutation({
    mutationFn: createHackathon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hackathons'] });
      setName('');
      setStartDate('');
      setDurationHours(48);
      setProjectIdea('');
    },
    onError: (error) => {
      alert(`An error occurred: ${error.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hackathonData = {
      name,
      startDate,
      durationHours,
      projectIdea,
    };
    mutation.mutate(hackathonData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a New Hackathon</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" type="text" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input id="startDate" type="datetime-local" value={startDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="durationHours">Duration (hours)</Label>
            <Input id="durationHours" type="number" value={durationHours} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDurationHours(Number(e.target.value))} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="projectIdea">Project Idea (optional)</Label>
            <Textarea id="projectIdea" value={projectIdea} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setProjectIdea(e.target.value)} />
          </div>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating...' : 'Create Hackathon'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateHackathonForm;