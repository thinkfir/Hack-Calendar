import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import CreateHackathonForm from '../components/common/CreateHackathonForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Hackathon {
  id: number;
  name: string;
  start_date: string;
  duration_hours: number;
  project_idea: string;
}

const fetchHackathons = async (): Promise<Hackathon[]> => {
  const { data } = await api.get('/hackathons');
  return data;
};

const HackathonPage = () => {
  const { data: hackathons, error, isLoading, isError } = useQuery<Hackathon[], Error>({
    queryKey: ['hackathons'],
    queryFn: fetchHackathons,
  });

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Hack-Calendar</h1>
        <p className="text-muted-foreground">Your central hub for managing hackathons.</p>
      </div>

      <CreateHackathonForm />

      <div>
        <h2 className="text-2xl font-semibold mb-4">Current Hackathons</h2>
        {isLoading && <div>Loading...</div>}
        {isError && <div>Error: {error.message}</div>}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {hackathons && hackathons.length > 0 ? (
            hackathons.map((hackathon) => (
              <Card key={hackathon.id}>
                <CardHeader>
                  <CardTitle>{hackathon.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Project Idea: {hackathon.project_idea || 'Not specified'}
                  </p>
                  <p className="text-sm">
                    Starts: {new Date(hackathon.start_date).toLocaleString()}
                  </p>
                  <p className="text-sm">
                    Duration: {hackathon.duration_hours} hours
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            !isLoading && <p>No hackathons found. Create one to get started!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HackathonPage;