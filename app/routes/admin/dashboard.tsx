import { Header, StatsCard, TripCard } from 'components'
import { getUser } from '~/appwrite/auth';
import { dashbaordStats, users, allTrips } from '~/constants';
import type { Route } from './+types/dashboard';

const { totalUsers, usersJoined, totalTrips, tripsCreated, userRole } = dashbaordStats;

export const clientLoader = async () => {
  try {
    const user = await getUser();
    return { user }; // Always return an object with `user`
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return { user: null }; // Explicitly return null
  }
};

const Dashboard = ({ loaderData }: Route.ComponentProps) => {
  const user = loaderData.user as User | null;

  // Redirect or show a loading state if user is null
  if (!user) {
    return (
      <div className="grid place-items-center h-screen">
        <p>Loading or not authenticated...</p>
        {/* Or redirect: <Navigate to="/login" /> */}
      </div>
    );
  }

  return (
    <main className="dashboard wrapper">
       <Header
          title={`Welcome ${user?.name ?? 'Guest'} 👋`}
          description="Track activity, trends and popular destinations in real time"
        />

        <section className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">

            <StatsCard
              headerTitle="Total Users"
              total={totalUsers}
              currentMonthCount={usersJoined.currentMonth}
              lastMonthCount={usersJoined.lastMonth}
            />

            <StatsCard
              headerTitle="Total Trips"
              total={totalUsers}
              currentMonthCount={tripsCreated.currentMonth}
              lastMonthCount={tripsCreated.lastMonth}
            />

            <StatsCard
              headerTitle="Active Users"
              total={userRole.total}
              currentMonthCount={userRole.currentMonth}
              lastMonthCount={userRole.lastMonth}
            />
          </div>

        </section>

        <section className="container">
          <h1 className="text-xl font-semibold text-dark-100">
            Created Trips
          </h1>

          <div className='trip-grid'>
            {allTrips.map((trip) => (
                <TripCard
                    key={trip.id}
                    id={trip.id.toString()}
                    name={trip.name!}
                    imageUrl={trip.imageUrls[0]}
                    location={trip.itinerary?.[0]?.location ?? ''}
                    tags={[trip.interests!, trip.travelStyle!]}
                    price={trip.estimatedPrice!}
                />
            ))}
          </div>
        </section>
    </main>
  )
}

export default Dashboard
