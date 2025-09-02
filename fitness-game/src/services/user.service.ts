// src/services/user-timezone.service.ts

import { IUserRepository } from '@/repositories/user.repository';
import { IUserTimezoneService } from '@/shared/interfaces';
import { notFoundCheck } from '@/shared/errors';
import { DEFAULT_VALUES } from '@/lib/constants';

// In a real application, this would fetch the user's preferred timezone from their profile.
// For demonstration, we'll provide a default or a simple lookup.
export class UserService implements IUserTimezoneService {
  constructor(private readonly userRepository: IUserRepository) {}
  async getUserTimezone(userId: string): Promise<string> {
    const user = notFoundCheck(await this.userRepository.findById(userId), 'User');

    return user.timezone ?? DEFAULT_VALUES.TIMEZONE;
  }
}