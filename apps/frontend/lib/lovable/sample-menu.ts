import type { MenuData, Option } from "@/types/lovable/menu"

const burrata = "/lovable/store/burrata.jpg"
const courgette = "/lovable/store/courgette.jpg"
const burger = "/lovable/store/burger.jpg"
const bowl = "/lovable/store/bowl.jpg"
const chicken = "/lovable/store/chicken.jpg"
const risotto = "/lovable/store/risotto.jpg"
const tiramisu = "/lovable/store/tiramisu.jpg"
const tart = "/lovable/store/tart.jpg"
const SIZE = (): Option => ({
  group: "Portion",
  type: "one",
  tr: { fr: { group: "Portion" } },
  choices: [
    { n: "Regular", p: 0, tr: { fr: { n: "Normale" } } },
    { n: "Large", p: 3, tr: { fr: { n: "Grande" } } },
  ],
})

export const DEFAULT_MENU: MenuData = {
  languages: ["en", "fr"],
  allergens: [
    {
      id: "gluten",
      name: "Gluten",
      icon: "🌾",
      tr: { fr: { name: "Gluten" } },
    },
    { id: "milk", name: "Milk", icon: "🥛", tr: { fr: { name: "Lait" } } },
    { id: "egg", name: "Eggs", icon: "🥚", tr: { fr: { name: "Œufs" } } },
    {
      id: "nuts",
      name: "Nuts",
      icon: "🥜",
      tr: { fr: { name: "Fruits à coque" } },
    },
    { id: "fish", name: "Fish", icon: "🐟", tr: { fr: { name: "Poisson" } } },
    { id: "soy", name: "Soy", icon: "🫘", tr: { fr: { name: "Soja" } } },
    {
      id: "sesame",
      name: "Sesame",
      icon: "⚪",
      tr: { fr: { name: "Sésame" } },
    },
  ],
  discounts: [
    {
      id: "d1",
      code: "WELCOME10",
      type: "percent",
      value: 10,
      min: 0,
      expires: "2026-12-31",
      active: true,
    },
    {
      id: "d2",
      code: "LUNCH5",
      type: "fixed",
      value: 5,
      min: 30,
      expires: "2026-11-30",
      active: true,
    },
  ],
  categories: [
    {
      id: "c1",
      cat: "Starters",
      tr: { fr: { cat: "Entrées" } },
      items: [
        {
          id: "burrata",
          n: "Burrata & heirloom tomato",
          d: "Basil oil, sourdough crumb",
          p: 11,
          images: [burrata, courgette],
          tag: "Veggie",
          tax: 10,
          allergens: ["milk", "gluten"],
          tr: {
            fr: {
              n: "Burrata & tomates anciennes",
              d: "Huile de basilic, chapelure de levain",
            },
          },
          options: [
            {
              group: "Extras",
              type: "many",
              tr: { fr: { group: "Suppléments" } },
              choices: [
                {
                  n: "Extra sourdough",
                  p: 2,
                  tr: { fr: { n: "Pain au levain" } },
                },
                { n: "Parma ham", p: 4, tr: { fr: { n: "Jambon de Parme" } } },
              ],
            },
          ],
        },
        {
          id: "courgette",
          n: "Crispy courgette flowers",
          d: "Ricotta, lemon honey",
          p: 9,
          images: [courgette],
          tax: 10,
          allergens: ["gluten", "milk", "egg"],
          tr: {
            fr: {
              n: "Fleurs de courgette croustillantes",
              d: "Ricotta, miel citronné",
            },
          },
          options: [
            {
              group: "Dip",
              type: "one",
              tr: { fr: { group: "Sauce" } },
              choices: [
                { n: "Lemon honey", p: 0, tr: { fr: { n: "Miel citronné" } } },
                { n: "Spicy aioli", p: 0, tr: { fr: { n: "Aïoli épicé" } } },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "c2",
      cat: "Mains",
      tr: { fr: { cat: "Plats" } },
      items: [
        {
          id: "burger",
          n: "Burger Maison",
          d: "Aged beef, comté, pickles, fries",
          p: 17,
          images: [burger],
          tag: "Bestseller",
          tax: 10,
          allergens: ["gluten", "milk", "sesame"],
          tr: { fr: { d: "Bœuf maturé, comté, pickles, frites" } },
          options: [
            {
              group: "Cooking",
              type: "one",
              tr: { fr: { group: "Cuisson" } },
              choices: [
                { n: "Rare", p: 0, tr: { fr: { n: "Saignant" } } },
                { n: "Medium", p: 0, tr: { fr: { n: "À point" } } },
                { n: "Well done", p: 0, tr: { fr: { n: "Bien cuit" } } },
              ],
            },
            {
              group: "Side",
              type: "one",
              tr: { fr: { group: "Accompagnement" } },
              choices: [
                { n: "Fries", p: 0, tr: { fr: { n: "Frites" } } },
                { n: "Salad", p: 0, tr: { fr: { n: "Salade" } } },
                {
                  n: "Truffle fries",
                  p: 3,
                  tr: { fr: { n: "Frites à la truffe" } },
                },
              ],
            },
            {
              group: "Extras",
              type: "many",
              tr: { fr: { group: "Suppléments" } },
              choices: [
                { n: "Bacon", p: 2 },
                {
                  n: "Extra cheese",
                  p: 1.5,
                  tr: { fr: { n: "Fromage en plus" } },
                },
                { n: "Fried egg", p: 1.5, tr: { fr: { n: "Œuf au plat" } } },
              ],
            },
          ],
        },
        {
          id: "bowl",
          n: "Green bowl",
          d: "Quinoa, avocado, miso dressing",
          p: 14,
          images: [bowl],
          tag: "Vegan",
          tax: 10,
          allergens: ["soy", "sesame"],
          tr: { fr: { n: "Bowl vert", d: "Quinoa, avocat, sauce miso" } },
          options: [
            SIZE(),
            {
              group: "Protein",
              type: "one",
              tr: { fr: { group: "Protéine" } },
              choices: [
                { n: "None", p: 0, tr: { fr: { n: "Aucune" } } },
                { n: "Tofu", p: 2.5 },
                { n: "Salmon", p: 4, tr: { fr: { n: "Saumon" } } },
              ],
            },
          ],
        },
        {
          id: "chicken",
          n: "Roast chicken",
          d: "Herb jus, crushed potatoes",
          p: 19,
          images: [chicken],
          tax: 10,
          allergens: [],
          tr: {
            fr: {
              n: "Poulet rôti",
              d: "Jus aux herbes, écrasé de pommes de terre",
            },
          },
          options: [SIZE()],
        },
        {
          id: "risotto",
          n: "Wild mushroom risotto",
          d: "Parmesan, thyme",
          p: 16,
          images: [risotto],
          tag: "Veggie",
          tax: 10,
          allergens: ["milk"],
          tr: { fr: { n: "Risotto aux champignons", d: "Parmesan, thym" } },
          options: [
            SIZE(),
            {
              group: "Extras",
              type: "many",
              tr: { fr: { group: "Suppléments" } },
              choices: [
                {
                  n: "Truffle shavings",
                  p: 5,
                  tr: { fr: { n: "Copeaux de truffe" } },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "c3",
      cat: "Desserts",
      tr: { fr: { cat: "Desserts" } },
      items: [
        {
          id: "tiramisu",
          n: "Tiramisu",
          d: "Mascarpone, espresso",
          p: 7,
          images: [tiramisu],
          tax: 10,
          allergens: ["milk", "egg", "gluten"],
          options: [],
        },
        {
          id: "tart",
          n: "Lemon tart",
          d: "Torched meringue",
          p: 7,
          images: [tart],
          tax: 10,
          allergens: ["gluten", "egg", "milk"],
          tr: { fr: { n: "Tarte au citron", d: "Meringue flambée" } },
          options: [],
        },
      ],
    },
  ],
}
