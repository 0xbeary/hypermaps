import { Chat } from '@/schema';
import {
  HypergraphSpaceProvider,
  preparePublish,
  publishOps,
  useCreateEntity,
  useHypergraphApp,
  useQuery,
  useSpace,
  useSpaces,
} from '@graphprotocol/hypergraph-react';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

export const Route = createFileRoute('/private-space/$space-id')({
  component: RouteComponent,
});

function RouteComponent() {
  const { 'space-id': spaceId } = Route.useParams();

  return (
    <HypergraphSpaceProvider space={spaceId}>
      <PrivateSpace />
    </HypergraphSpaceProvider>
  );
}

function PrivateSpace() {
  const { name, ready } = useSpace({ mode: 'private' });
  const { data: chats } = useQuery(Chat, { mode: 'private' });
  const { data: publicSpaces } = useSpaces({ mode: 'public' });
  const [selectedSpace, setSelectedSpace] = useState<string>('');
  const createAddress = useCreateEntity(Chat);
  const [addressName, setAddressName] = useState('');
  const { getSmartSessionClient } = useHypergraphApp();

  if (!ready) {
    return <div>Loading...</div>;
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createAddress({ name: addressName, description: 'Beautiful chat' });
    setAddressName('');
  };

  const publishToPublicSpace = async (chat: Chat) => {
    if (!selectedSpace) {
      alert('No space selected');
      return;
    }
    try {
      const { ops } = await preparePublish({ entity: chat, publicSpace: selectedSpace });
      const smartSessionClient = await getSmartSessionClient();
      if (!smartSessionClient) {
        throw new Error('Missing smartSessionClient');
      }
      const publishResult = await publishOps({
        ops,
        space: selectedSpace,
        name: 'Publish Chat',
        walletClient: smartSessionClient,
      });
      console.log(publishResult, ops);
      alert('Chat published to public space');
    } catch (error) {
      console.error(error);
      alert('Error publishing chat to public space');
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <h1 className="text-2xl font-bold">{name}</h1>
      <form onSubmit={handleSubmit}>
        <label className="flex flex-col">
          <span className="text-sm font-bold">Chat</span>
          <input type="text" value={addressName} onChange={(e) => setAddressName(e.target.value)} />
        </label>
        <button type="submit">Create Chat</button>
      </form>

      <ul>
        {chats?.map((chat) => (
          <li key={chat.id}>
            {chat.name}
            <select value={selectedSpace} onChange={(e) => setSelectedSpace(e.target.value)}>
              <option value="">Select a space</option>
              {publicSpaces?.map((space) => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </select>
            <button onClick={() => publishToPublicSpace(chat)}>Publish</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
