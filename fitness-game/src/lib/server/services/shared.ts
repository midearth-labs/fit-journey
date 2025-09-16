import type { AuthRequestContext } from "../shared/interfaces";

export type ServiceCreatorFromRequestContext<S> = (requestContext: AuthRequestContext) => S;
export type ServiceCreatorFromDependencies<D, S> = (dependencies: D) => ServiceCreatorFromRequestContext<S>;


export const createServiceFromClass = <D, S>(
    ServiceClass: new (dependencies: D, requestContext: AuthRequestContext) => S,
    dependencies: D,
  ): ServiceCreatorFromRequestContext<S> => 
        (requestContext: AuthRequestContext) => 
            new ServiceClass(dependencies, requestContext);
  