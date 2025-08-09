import { useMatch, useParams } from 'react-router-dom';
import { getCanonicalAliasRoomId, isRoomAlias } from '../../utils/matrix';
import { useMatrixClient } from '../useMatrixClient';
import { getSpaceLobbyPath, getSpaceSearchPath } from '../../pages/pathUtils';

export const useSelectedSpace = (): string | undefined => {
  const mx = useMatrixClient();

  const { spaceIdOrAlias } = useParams();

  // Decode the URI component since we encode it in path generation
  const decodedSpaceIdOrAlias = spaceIdOrAlias ? decodeURIComponent(spaceIdOrAlias) : undefined;

  const spaceId =
    decodedSpaceIdOrAlias && isRoomAlias(decodedSpaceIdOrAlias)
      ? getCanonicalAliasRoomId(mx, decodedSpaceIdOrAlias)
      : decodedSpaceIdOrAlias;

  return spaceId;
};

export const useSpaceLobbySelected = (spaceIdOrAlias: string): boolean => {
  const match = useMatch({
    path: getSpaceLobbyPath(spaceIdOrAlias),
    caseSensitive: true,
    end: false,
  });

  return !!match;
};

export const useSpaceSearchSelected = (spaceIdOrAlias: string): boolean => {
  const match = useMatch({
    path: getSpaceSearchPath(spaceIdOrAlias),
    caseSensitive: true,
    end: false,
  });

  return !!match;
};
