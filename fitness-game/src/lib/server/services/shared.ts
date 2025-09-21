import type { AuthRequestContext, MaybeAuthRequestContext } from "../shared/interfaces";

export type ServiceCreatorFromRequestContext<S> = (requestContext: AuthRequestContext) => S;
export type ServiceCreatorFromMaybeAuthRequestContext<S> = (requestContext: MaybeAuthRequestContext) => S;
export type ServiceCreatorFromDependencies<D, S> = (dependencies: D) => ServiceCreatorFromRequestContext<S>;


export const createServiceFromClass = <D, S>(
    ServiceClass: new (dependencies: D, requestContext: AuthRequestContext) => S,
    dependencies: D,
  ): ServiceCreatorFromRequestContext<S> => 
        (requestContext: AuthRequestContext) => 
            new ServiceClass(dependencies, requestContext);
  
export const createUnAuthServiceFromClass = <D, S>(
  ServiceClass: new (dependencies: D, requestContext: MaybeAuthRequestContext) => S,
  dependencies: D,
): ServiceCreatorFromMaybeAuthRequestContext<S> => 
      (requestContext: MaybeAuthRequestContext) => 
          new ServiceClass(dependencies, requestContext);
