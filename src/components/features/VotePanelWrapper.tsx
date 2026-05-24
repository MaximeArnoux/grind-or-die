import { VotePanelClient } from './VotePanelClient'

export function VotePanelWrapper({ userId }: { userId: string }) {
  return <VotePanelClient userId={userId} />
}
