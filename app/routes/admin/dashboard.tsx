import { Header, StatsCard, TripCard } from 'components'
import { dashbaordStats, users, allTrips } from '~/constants';

const Dashboard = () => {
  const user = { name: 'Ryan'};

  const { totalUsers, usersJoined, totalTrips, tripsCreated, userRole } = dashbaordStats;

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

        <TripCard />
    </main>
  )
}

export default Dashboard
