import Elysia from "elysia";
import { errorExampleModule } from "../error-example";
import { exampleModule } from "../example";
import { healthModule } from "../health";
import { problemsModule } from "../problems";
import { profileModule } from "../profile";
import { scopesModule } from "../scopes";
import { skillsModule } from "../skills";

export const apiModule = new Elysia({ prefix: "/api" })
	.use(healthModule)
	.use(scopesModule)
	.use(skillsModule)
	.use(problemsModule)
	.use(profileModule)
	.use(errorExampleModule)
	.use(exampleModule);
