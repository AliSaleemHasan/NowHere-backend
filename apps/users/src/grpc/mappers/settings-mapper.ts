import { maxDistance_TO_SEE, MIN_DISTANCE_TO_POST } from 'nowhere-common';
import { Settings } from '../../settings/entities/settings.entity';
import { Settings as ProtoSettings } from 'proto';
import { mapUserToProto } from './user-mappers';
export function mapSettingstoProto(settings: Settings): ProtoSettings {
  return {
    id: settings.id ?? '',
    maxDistance: settings.maxDistance ?? maxDistance_TO_SEE,
    newSnapDistance: settings.newSnapDistance ?? MIN_DISTANCE_TO_POST,
    snapDisappearTime: settings.snapDisappearTime ?? 1,
    user: mapUserToProto(settings.user),
  };
}
