# T-State

Um gerenciador de estado global para React com Typescript em mente

## Criação de stores

Stores podem ser fortemente tipadas passando o formato do estado e opcionalmente os payloads dos reducers. O estado deve ser passado como um objeto

```tsx
import Store from 't-state';

type TestState = {
  firstName: string;
  lastName: string;
};

type ReducersPayloads = {
  setName: string;
};

const testStore = new Store<TestState, ReducersPayloads>({
  name: 'test',
  state: {
    firstName: 'Hello',
    lastName: 'World',
  },
  reducers: {
    setName: (currentState, name) => {
      const [firstName, lastName] = name.split(' ');

      return {
        firstName,
        lastName,
      };
    },
  },
});
```

## Uso em componentes

Cada store tem hooks que podem ser usados para derivar/selecionar estado

### `useSelector`

Permite a seleção ou derivação de qualquer valor de uma store e dispara re-renders sempre que o valor do seletor é alterado eliminando rerenders desnecessários. P

```tsx
const Component = () => {
  const fullName = testStore.useSelector(
    (state) => `${state.firstName} ${state.lastName}`,
  );

  return <div>Name: {fullName}</div>;
};
```

Por padrão os valores são comparados via shallow equality check, que compara valores com até um nível de profundidade. Para comparações mais complexas é possível usar `deepEqual` ou outra função de igualdade customizada para evitar re-renders

```tsx
import { deepEqual } from 't-state';

const Component = () => {
  const fullName = testStore.useSelector(
    (state) =>
      [
        [
          {
            firstName: state.firstName,
          },
        ],
        [
          {
            lastName: state.lastName,
          },
        ],
      ] as const,
    { equalityFn: deepEqual },
  );

  return (
    <div>
      Name: {fullName[0][0].firstName} {fullName[1][0].lastName}
    </div>
  );
};
```

### `useKey`

Use key funciona de forma similar ao hook `React.useState`

```tsx
const Component = () => {
  const [firstName, setFirstName] = testStore.useKey('firstName');

  return (
    <>
      <div>Name: {firstName}</div>

      <input onChange={(e) => setFirstName(e.currentTarget.value)} />
    </>
  );
};
```

## Alterando estado

A alteração de estado pode ser feita por meio de reducers, ou por meio de mutação usando [immer](https://immerjs.github.io/immer/)

### Alterando via reducers

Reducers são usados por meio da função `dispatch`, passando id do reducer e o payload

```tsx
testStore.dispatch('setName', 'John Doe');
```

### Alterando via immer

Com o `produceState` é possível alterar o estado mutacionado o valores mantendo a imutabilidade da store, isso é especialmente útil para atualizar "deep nested values". Para mais detalhes e possibildades consulte a [documentação do immer](https://immerjs.github.io/immer/update-patterns)

```tsx
testStore.produceState((draftState) => {
  draftState.firstName = 'John';
  draftState.lastName = 'Doe';
});

testStore.produceState((draftState) => {
  draftState.updating.aReally.deep.value = 'new value';
});
```

## Debug via Redux Dev Tools

A extensão [Redux Dev Tools](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en) permite a visualização de todas as alterações de cada store

## Reagindo a mudanças de estado

Fora do react é possível reagir a mudanças de estado com o método subscribe. Que retorna uma função para desincrever a subscription

```tsx
const unsubscribe = testStore.subscribe((prev, current) => {
  console.log('prev name', prev.firstName, prev.lastName);

  console.log('new name', current.firstName, current.lastName);
});

// unsubscribing
unsubscribe();
```

Por meio do util `obseverChanges` é possível reagir de forma mais seletiva a mudanças

```tsx
import { observeChanges } from 't-state/subscribeUtils';

testState.subscribe((prev, current) => {
  const observe = observeChanges(prev, current);

  observe
    .ifSelector((s) => `${s.firstName} ${s.lastName}`)
    .change.then((currentResult, prevResult) => {
      console.log('full name changed from', prevResult, 'to', currentResult);
    });
});
```

## Criando stores dentro de componentes

Stores podem também ser criadas dentro de componentes por meio do hook `useCreateStore` e pemitem a optimização por meito de updates atomicos

```tsx
import { useCreateStore } from 't-state/useCreateStore';

type TestState = {
  numOfClicks1: number;
  numOfClicks2: number;
};

const Component = () => {
  const testState = useCreateStore<TestState>({
    name: 'teste',
    state: {
      numOfClicks1: 0,
      numOfClicks2: 0,
    },
  });

  return (
    <>
      <Child store={testState} id="numOfClicks1" />
      <Child store={testState} id="numOfClicks1" />
    </>
  );
};

type ChildProps = {
  store: Store<TestState>;
  id: keyof TestState;
};

const Child = ({ store, id }: ChildProps) => {
  const [numOfClicks, setNumOfClicks] = store.useKey(id);

  return (
    <button type="button" onClick={() => setNumOfClicks(numOfClicks + 1)}>
      {id} num of clicks: {numOfClicks}
    </button>
  );
};
```

No exemplo acima cada child component só é renderizado quando a parte que ele utiliza da store é alterada, diferente do que seria caso um simples `useState` fosse usado

## TODO:

- [ ] Traduzir documentação para o inglês
- [ ] v7 com suporte a react 18
