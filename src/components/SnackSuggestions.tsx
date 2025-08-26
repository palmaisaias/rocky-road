import SnackCard from './SnackCard'

export default function SnackSuggestions() {
  return (
    <section className="mb-4">
      <header className="d-flex align-items-end justify-content-between mb-2">
        <div>
          <h2 className="h-ox fw-bold fs-4 mb-0">Mission Snacks</h2>
          <p className="text-secondary small mb-0">Consumables inspired by the film.</p>
        </div>
      </header>

      <div className="row g-3">
        <div className="col-12 col-md-6">
          <SnackCard
            title={'VX "Green Balls" - Candy Truffles'}
            subtitle="Looks dangerous, tastes great"
            steps={[
              'Pulse 24 vanilla sandwich cookies into fine crumbs.',
              'Stir in 6 oz cream cheese until a dough forms.',
              'Tint with a few drops green gel coloring - bright but not neon.',
              'Roll into 1-inch balls. Chill 20 minutes.',
              'Dip in melted white chocolate. Before set, drizzle more green.',
              'Optional: top with a single white sugar pearl. Handle… carefully.'
            ]}
            note="Serve in a clear tray for maximum uh oh energy."
          />
        </div>

        <div className="col-12 col-md-6">
          <SnackCard
            title="Alcatraz Sourdough Bites"
            subtitle="Garlic-parmesan butter, toasted"
            steps={[
              'Cube a sourdough loaf into bite-size pieces.',
              'Toss with melted butter, garlic powder, parsley, and grated parm.',
              'Bake at 375°F 8-10 minutes until crisp edges form.',
              'Finish with a squeeze of lemon and a pinch of flake salt.'
            ]}
          />
        </div>

        <div className="col-12 col-md-6">
          <SnackCard
            title="Mason’s Scotch-Glazed Little Smokies"
            subtitle="Sweet heat with a salty finish"
            steps={[
              'Simmer 1 cup barbecue sauce with 1/3 cup apricot jam and a splash of Scotch.',
              'Add pinch chili flakes and a dash Worcestershire.',
              'Toss in little smokies and cook until glossy.'
            ]}
          />
        </div>

        <div className="col-12 col-md-6">
          <SnackCard
            title="Car Chase Nacho Bar"
            subtitle="Build-your-own - crunchy, melty, chaos"
            steps={[
              'Lay out tortilla chips, queso, shredded jack, jalapeños, black beans, pico, crema.',
              'Add a nitro bowl: chopped pickled pepperoncini + lime zest.',
              'Guests assemble and blast under broiler 2-3 minutes.'
            ]}
          />
        </div>
      </div>
    </section>
  )
}