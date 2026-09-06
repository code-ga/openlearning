import Elysia from "elysia";
import { errorExampleModule } from "../error-example";
import { exampleModule } from "../example";
import { profileModule } from "../profile";
import { healthModule } from "../health";
import { scopesModule } from "../scopes";
import { skillsModule } from "../skills";
import { problemsModule } from "../problems";

export const apiModule = new Elysia({ prefix: "/api" })
  .use(healthModule)
  .use(scopesModule)
  .use(skillsModule)
  .use(problemsModule)
  .use(profileModule)
  .use(errorExampleModule)
  .use(exampleModule);