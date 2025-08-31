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
    title="VX Gas Bomb Cookies"
    subtitle="Dangerously delicious"
    steps={[
      'Whisk 1 cup butter with 1 1/2 cups sugar until light and fluffy.',
      'Beat in 2 eggs, 1 tsp vanilla.',
      'Fold in 3 cups flour, 1 tsp baking powder, pinch of salt.',
      'Add green candy pieces or sour apple candies to mimic VX spheres.',
      'Scoop into balls, bake at 350°F for 10–12 minutes.',
      'Cool… if you dare.'
    ]}
    note="Serve in a glass bowl for maximum “containment breach” effect."
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
    title="Mason’s Escape Plan"
    subtitle="Smoky, dangerous, unforgettable"
    steps={[
      'In a shaker with ice: 2 oz Scotch, 1 oz honey syrup, 1/2 oz fresh lemon juice.',
      'Add 2 dashes Angostura bitters and a whisper of Lapsang Souchong tea for smoke.',
      'Shake hard, strain into a rocks glass over a large cube.',
      'Garnish with a lemon twist… or a single “VX” green candy on the rim for drama.'
    ]}
    note="Best enjoyed while plotting an impossible breakout."
  />
</div>


        <div className="col-12 col-md-6">
  <SnackCard
    title="VX Candy Alert"
    subtitle="Diana’s tactical sugar drop"
    steps={[
      'Before the movie gets rolling, crack open the stash Diana sent.',
      'They’re green, they’re sour, they’re shaped like VX gas balls from The Rock.',
      'Pop one. Survive the blast. Keep watching.'
    ]}
  />
</div>

      </div>
    </section>
  )
}