import { useParams } from 'react-router-dom';
import { getCanonicalAliasRoomId, isRoomAlias } from '../../utils/matrix';
import { useMatrixClient } from '../useMatrixClient';

export const useSelectedRoom = (): string | undefined => {
  const mx = useMatrixClient();

  const { roomIdOrAlias } = useParams();
  
  // Decode the URI component since we encode it in path generation  
  const decodedRoomIdOrAlias = roomIdOrAlias ? decodeURIComponent(roomIdOrAlias) : undefined;
  
  const roomId =
    decodedRoomIdOrAlias && isRoomAlias(decodedRoomIdOrAlias)
      ? getCanonicalAliasRoomId(mx, decodedRoomIdOrAlias)
      : decodedRoomIdOrAlias;

  return roomId;
};
