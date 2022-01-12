import supertest from "supertest";
import {
  describe,
  beforeEach,
  test,
  expect,
  beforeAll,
  afterEach,
  afterAll,
} from "@jest/globals";
import { connect, clearDatabase, closeDatabase } from "./memory-db-handler";
import app from "../src/app";
import userModel from "../src/models/user";
import taskModel from "../src/models/task";
import teamModel from "../src/models/teamModel";
import projectModel from "../src/models/projectModel";
import commentModel from "../src/models/comments";
import activityModel from "../src/models/activity";
import bcrypt from "bcrypt";
import { response } from "express";

//initial declaration for typescript intellisense support
let request = supertest.agent();

/**
 * Connect to a new in-memory database before running any tests.
 */
beforeAll(async () => await connect());

/**
 * Clear all test data after every test.
 */
afterEach(async () => await clearDatabase());

/**
 * Remove and close the db and server.
 */
afterAll(async () => await closeDatabase());

/**
 * Resets the session for each tests.
 */
beforeEach(() => {
  request = supertest.agent(app);
});

const user1Login = {
  email: "kayodeodole@gmail.com",
  password: "123456",
};

const user1Reg = {
  email: "kayodeodole@gmail.com",
  password: bcrypt.hashSync("123456", 12),
  fullname: "kayode odole",
};

const user2Login = {
  email: "kayodeodole2@gmail.com",
  password: "123456",
};

const user2Reg = {
  email: "kayodeodole2@gmail.com",
  password: bcrypt.hashSync("123456", 12),
  fullname: "kayode odole",
};

const sweepTheFloorTask = {
  title: "Sweep the floor",
  description: "Kayode don't forget to sweep the floor of your room.",
  dueDate: "10/26/2021",
};

//simulating adding a file

const project1 = {
  name: "New project",
};

const teamB = {
  teamName: "The Best Team in Decagon",
  about: "Na them dey run things!!!! okrrruuuuu",
};

const loginSuccessText = "Found. Redirecting to /users/welcome";
const loginFailText = "Found. Redirecting to /users/loginfail";

describe("TASK TEST", () => {
  test("should allow owner to create task", async () => {
    /*steps
    1. owner should have signed up
    2. owner should have logged in
    3. there should be an assignee in the db
    4. owner can create task
    */
    //register user1 into the database
    const user1 = await userModel.create(user1Reg);
    //register user2 into the database
    const user2 = await userModel.create(user2Reg);

    //owner login
    const response = await request
      .post("/users/login")
      .send(user1Login)
      .expect(200);
    // .expect(302)
    // .expect((res) => {
    //   expect(res.text).toBe(loginSuccessText);
    // });
    //owner create task
    await request
      .post("/tasks/create")
      .send({
        ...sweepTheFloorTask,
        assignee: user2._id,
      })
      .set("token", response.body.token)
      .expect(201)
      .expect((response) => {
        expect(response.body.msg).toBe("Task created successfully");
      });
  });

  test("should allow user to get tasks assigned to them.", async () => {
    //register user1 into the database
    await userModel.create(user1Reg);
    //login
    const response = await request
      .post("/users/login")
      .send(user1Login)
      .expect(200);
    // .expect((res) => {
    //   expect(res.text).toBe(loginSuccessText);
    // });
    //user can get task assigned to them
    await request
      .get("/tasks")
      .set("token", response.body.token)
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body.tasks)).toBe(true);
      });
  });

  test("should allow owner to delete task", async () => {
    //register user1 into the database
    const user1Db = await userModel.create(user1Reg);
    //regist user2 into the database
    const user2Db = await userModel.create(user2Reg);

    //user1 creates a task
    const taskDb = await taskModel.create({
      ...sweepTheFloorTask,
      owner: user1Db._id,
      assignee: user2Db._id,
    });

    //user2 login
    let response = await request
      .post("/users/login")
      .send(user2Login)
      .expect(200);
    // .expect((res) => {
    //   expect(res.text).toBe(loginSuccessText);
    // });

    //user2 should not be allowed to delete task
    await request
      .delete(`/tasks/${taskDb._id}`)
      .set("token", response.body.token)
      .expect(403)
      .expect((res) => {
        expect(res.body.message).toBe(
          "You are not authorized to delete this task."
        );
      });

    //user2 logsout
    // await request.get("/users/logout").expect(200);

    //user1 logs in
    response = await request.post("/users/login").send(user1Login).expect(200);
    // .expect((res) => {
    //   expect(res.text).toBe(loginSuccessText);
    // });

    //user1 deletes the task
    await request
      .delete(`/tasks/${taskDb._id}`)
      .set("token", response.body.token)
      .expect(200)
      .expect((res) => {
        expect(res.body.message).toBe("Deleted successfully");
      });
  });

  test("user should be able to update a task ", async () => {
    // user must be register
    const user1Db = await userModel.create(user1Reg);
    const user2Db = await userModel.create(user2Reg);
    const user3Db = await userModel.create({
      ...user2Reg,
      email: "anotheremail@gmail.com",
    });

    //create project
    const projectA = await projectModel.create({
      ...project1,
      owner: user1Db._id,
    });

    //user1 creates a task
    const taskDb = await taskModel.create({
      ...sweepTheFloorTask,
      owner: user1Db._id,
      status: "backlog",
      assignee: user2Db._id,
    });

    //login user
    const response = await request
      .post("/users/login")
      .send(user1Login)
      .expect(200);
    // .expect((res) => {
    //   expect(res.text).toBe(loginSuccessText);
    // });

    await request
      .put(`/tasks/update/${taskDb._id}`)
      .send({
        title: " new title",
        description: " description",
        status: "status",
        assignee: user3Db._id,
        createdAt: new Date("11/13/2021"),
        dueDate: new Date("11/16/2021"),
      })
      .set("token", response.body.token)
      .expect(201)
      .expect((res) => {
        expect(res.body.status).toBe("success");
      });
  });
});

describe("TEAM TEST", () => {
  test("should allow owner to create a team", async () => {
    /**STEP
     * owner should have signed up
     * owner should be logged in
     * owner should create team.
     */
    //sign up owner
    const user1Db = await userModel.create(user1Reg);
    //login owner
    const response = await request
      .post("/users/login")
      .send(user1Login)
      .expect(200);
    // .expect((res) => {
    //   expect(res.text).toBe(loginSuccessText);
    // });

    //create project
    const projectA = await projectModel.create({
      ...project1,
      owner: user1Db._id,
    });

    //create team
    await request
      .post(`/teams/create/${projectA._id}`)
      .set("token", response.body.token)
      .send(teamB)
      .expect(201)
      .expect((response) => {
        expect(response.body.message).toBe("Team created successfully");
      });
  });

  test("shoud allow team member to leave a team", async () => {
    /*
    create a team
    add a member to the team
    member should be able to leave the team
    */
    //sign up owner
    const user1Db = await userModel.create(user1Reg);
    //regist user2 into the database
    const user2Db = await userModel.create(user2Reg);
    //create project
    const projectA = await projectModel.create({
      ...project1,
      owner: user1Db._id,
    });

    const team = await teamModel.create({
      teamName: "sample team",
      about: "created for the purpose of test",
      members: [user2Db._id],
      projectId: projectA._id,
      createdBy: user1Db._id,
    });

    //user2 will login
    const response = await request
      .post("/users/login")
      .send(user2Login)
      .expect(200);
    // .expect((res) => {
    //   expect(res.text).toBe(loginSuccessText);
    // });

    //user2 will leave the team
    await request
      .get(`/teams/leave/${team._id}`)
      .set("token", response.body.token)
      .expect(200)
      .expect((res) => {
        expect(res.body.message).toBe(
          `Successful removal from team ${team.teamName}`
        );
        expect(res.body.updatedMembers.length).toBe(team.members.length - 1);
      });
  });

  test("should allow owner to add members to team", async () => {
    /**
     * create a team
     * owner must be logged in
     * owner should add member to team
     */
    //sign up owner
    const user1Db = await userModel.create(user1Reg);
    //regist user2 into the database
    const user2Db = await userModel.create(user2Reg);
    //create project
    const projectA = await projectModel.create({
      ...project1,
      owner: user1Db._id,
    });

    const team = await teamModel.create({
      teamName: "sample team",
      about: "created for the purpose of test",
      members: [],
      projectId: projectA._id,
      createdBy: user1Db._id,
    });

    //user1 will login
    const response = await request
      .post("/users/login")
      .send(user1Login)
      .expect(200);
    // .expect((res) => {
    //   expect(res.text).toBe(loginSuccessText);
    // });

    // user1 will add user 2 to team

    await request
      .post(`/teams/addmember/${team._id}`)
      .set("token", response.body.token)
      .send({ newMemberID: user2Db._id })
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe("success");
      });
  });

  test("should allow owner to get all members of a team", async () => {
    //sign up owner
    const user1Db = await userModel.create(user1Reg);
    //regist user2 into the database
    const user2Db = await userModel.create(user2Reg);
    //create project
    const projectA = await projectModel.create({
      ...project1,
      owner: user1Db._id,
    });

    const team = await teamModel.create({
      teamName: "sample team",
      about: "created for the purpose of test",
      members: [],
      projectId: projectA._id,
      createdBy: user1Db._id,
    });

    //user1 will login
    const response = await request
      .post("/users/login")
      .send(user1Login)
      .expect(200);
    // .expect((res) => {
    //   expect(res.text).toBe(loginSuccessText);
    // });

    // user1 will add user 2 to team

    await request
      .post(`/teams/addmember/${team._id}`)
      .set("token", response.body.token)
      .send({ newMemberID: user2Db._id })
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe("success");
      });

    await request
      .get(`/teams/getAllTeamMembers/${team._id}`)
      .set("token", response.body.token)
      .expect(200)
      .expect((res) => {
        expect(res.body.members.length).toBe(1);
      });
  });

  test("Should allow owner to update team details", async () => {
    /**
     * owner must exist
     * owner must be logged in
     * there must be a team
     * owner should update details
     */
    //register user1 into the Database
    const user1Db = await userModel.create(user1Reg);

    //create project
    const projectA = await projectModel.create({
      ...project1,
      owner: user1Db._id,
    });

    const team = await teamModel.create({
      teamName: "sample team",
      about: "created for the purpose of test",
      members: [],
      projectId: projectA._id,
      createdBy: user1Db._id,
    });

    //user1 will login
    const response = await request
      .post("/users/login")
      .send(user1Login)
      .expect(200);
    // .expect((res) => {
    //   expect(res.text).toBe(loginSuccessText);
    // });

    await request
      .put(`/teams/updateTeamDetails/${team._id}`)
      .set("token", response.body.token)
      .send({
        teamName: "the name of the team",
        about: "about the team ",
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe("success");
      });
  });

  test("Users Should be able to get all tasks by status", async () => {
    /**
     * User must be logged in
     * tasks must exist
     * user should get tasks by status
     */
    const user1Db = await userModel.create(user1Reg);
    //regist user2 into the database
    const user2Db = await userModel.create(user2Reg);

    //user1 creates a task
    const taskDb = await taskModel.create({
      ...sweepTheFloorTask,
      owner: user1Db._id,
      status: "backlog",
      assignee: user2Db._id,
    });
    const taskDb2 = await taskModel.create({
      ...sweepTheFloorTask,
      owner: user1Db._id,
      status: "todo",
      assignee: user2Db._id,
    });
    const taskDb3 = await taskModel.create({
      ...sweepTheFloorTask,
      owner: user1Db._id,
      status: "done",
      assignee: user2Db._id,
    });

    const response = await request
      .post("/users/login")
      .send(user1Login)
      .expect(200);
    // .expect((res) => {
    //   expect(res.text).toBe(loginSuccessText);
    // });

    await request
      .get(`/tasks/getTasks/backlog`)
      .set("token", response.body.token)
      .expect(200)
      .expect((res) => {
        expect(res.body.tasks.length).toBe(1);
      });
    await request
      .get(`/tasks/getTasks/todo`)
      .set("token", response.body.token)
      .expect(200)
      .expect((res) => {
        expect(res.body.tasks.length).toBe(1);
      });
    await request
      .get(`/tasks/getTasks/done`)
      .set("token", response.body.token)
      .expect(200)
      .expect((res) => {
        expect(res.body.tasks.length).toBe(1);
      });
  });
});

describe("PROJECT TEST", () => {
  test("user should be able to create a project ", async () => {
    // user must be register
    const user1Db = await userModel.create(user1Reg);

    //login user
    const response = await request
      .post("/users/login")
      .send(user1Login)
      .expect(200);
    // .expect((res) => {
    //   expect(res.text).toBe(loginSuccessText);
    // });

    await request
      .post("/projects/create")
      .set("token", response.body.token)
      .send({ projectname: "nodejs" })
      .expect(201)
      .expect((res) => {
        expect(res.body.status).toBe("success");
      });
  });

  test("user should be able to invite a colaborator by email ", async () => {
    // user must be register
    const user1Db = await userModel.create(user1Reg);

    const user2Db = await userModel.create(user2Reg);

    //create project
    const projectA = await projectModel.create({
      ...project1,
      owner: user1Db._id,
    });

    //login user
    const response = await request
      .post("/users/login")
      .send(user1Login)
      .expect(200);
    // .expect((res) => {
    //   expect(res.text).toBe(loginSuccessText);
    // });

    await request
      .post("/projects/invite")
      .set("token", response.body.token)
      .send({ email: user2Login.email, projectname: projectA.name })
      .expect(200)
      .expect((res) => {
        expect(res.body.message).toBe(
          `${user2Login.email} have been added to ${projectA.name} project`
        );
      });

    await request
      .post("/projects/invite")
      .set("token", response.body.token)
      .send({ email: "chinesskks@gmail.com", projectname: projectA.name })
      .expect(200)
      .expect((res) => {
        expect(res.body.message).toBe(
          `email invite have been sent to chinesskks@gmail.com`
        );
      });
  });

  test("user should be able to get all projects", async () => {
    const user1Db = await userModel.create(user1Reg);
    const user2Db = await userModel.create(user2Reg);

    //create projectA
    const projectA = projectModel.create({
      name: "project 1",
      owner: user1Db._id,
    });
    //create projectB
    const projectB = projectModel.create({
      name: "project 2",
      owner: user2Db._id,
      collaborators: [user1Db._id],
    });

    //login user
    const response = await request
      .post("/users/login")
      .send(user1Login)
      .expect(200);
    // .expect((res) => {
    //   expect(res.text).toBe(loginSuccessText);
    // });

    await request
      .get("/projects/getproject")
      .set("token", response.body.token)
      .expect(200)
      .expect((res) => {
        expect(res.body.projects.length).toBe(2);
      });
  });

  test("user should be able to update project", async () => {
    const user1Db = await userModel.create(user1Reg);

    //create projectA
    const projectA = await projectModel.create({
      name: "project 1",
      owner: user1Db._id,
    });

    //login user
    const response = await request
      .post("/users/login")
      .send(user1Login)
      .expect(200);
    // .expect((res) => {
    //   expect(res.text).toBe(loginSuccessText);
    // });

    //user should update project
    const newProjectName = "new Project name";
    await request
      .put(`/projects/updateproject/${projectA._id}`)
      .set("token", response.body.token)
      .send({
        projectname: newProjectName,
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.updatedProject.name).toBe(newProjectName);
      });
  });

  test("user should be able to create an activity", async () => {
    /*steps
    1. owner should have signed up
    2. owner should have logged in
    3. there should be an assignee in the db
    4. owner can create task
    4. owner can create activity
    */
    const user1Db = await userModel.create(user1Reg);
    const user2Db = await userModel.create(user2Reg);

    //owner login
    const response = await request.post("/users/login").send(user1Login);
    // .expect(302)
    // .expect((res) => {
    //   expect(res.text).toBe(loginSuccessText);
    // });
    //create task successfully
    await request
      .post("/tasks/create")
      .send({
        ...sweepTheFloorTask,
        assignee: user2Db._id,
      })
      .set("token", response.body.token)
      .expect(201)
      .expect((response) => {
        expect(response.body.msg).toBe("Task created successfully");
      });

    await request
      .get("/tasks/activity")
      .set("token", response.body.token)
      .expect(200)
      .expect((response) => {
        expect(response.body.activities.length).toBe(1);
      });
  });
});

// Getting athe info of all team members from BY A USER
describe("Get all info of all members of a team", () => {
  test("User should be able to get all team mebers info", async () => {
    /*
      The user must have s1gnedup
      the user must have loggedin
      there must be acreated project
      there must be a team 
      there must be at least a member
    */

    const user1Db = await userModel.create(user1Reg); ///A ram=ndom user
    const user2Db = await userModel.create(user2Reg); ///The team member whose info is requested

    //login user
    const response = await request
      .post("/users/login")
      .send(user1Login)
      .expect(200); //In the code ... controller
    // .expect((res) => {
    //   expect(res.text).toBe(loginSuccessText)
    // })

    //creating a project
    const projectA = await projectModel.create({
      name: "project 1",
      owner: user1Db._id,
    });

    //create A team
    const team = await teamModel.create({
      teamName: "sample team",
      about: "created for the purpose of test",
      members: [],
      projectId: projectA._id,
      createdBy: user1Db._id,
    });

    team.members.push(user2Db._id);
    team.save();

    // const updatedteam = await Team.findByIdAndUpdate(
    //   { _id: teamId },
    //   { members: team.members },
    //   { new: true }
    // )

    //user1 creates a task
    const taskDb = await taskModel.create({
      ...sweepTheFloorTask,
      owner: user1Db._id,
      status: "backlog",
      assignee: user2Db._id,
    });

    //user should be able to get info for a particulat team member
    const teamInfo = await teamModel.findOne({ teamName: "sample team" });
    const teamId = teamInfo?._id;

    //all requests

    await request
      .get(`/teams/getUserDetails/${teamId}`)
      .set("token", response.body.token)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty("message");
        // expect(res.text.message).toBe('success')
      });
  });
});

describe("COMMENT TEST", () => {
  test("user should be able to create a comment on a task", async () => {
    //register user1 into the database
    const user1 = await userModel.create(user1Reg);
    //register user2 into the database
    const user2 = await userModel.create(user2Reg);

    //login user
    const response = await request
      .post("/users/login")
      .send(user1Login)
      .expect(200);
    // .expect(302)
    // .expect((res) => {
    //   expect(res.text).toBe(loginSuccessText);
    // });

    const taskDb = await taskModel.create({
      ...sweepTheFloorTask,
      owner: user1._id,
      status: "backlog",
      assignee: user2._id,
    });

    await request
      .post(`/comments/comment/${taskDb._id}`)
      .set("token", response.body.token)
      .send({ comment: "nice work" })
      .expect(200)
      .expect((res) => {
        expect(res.body.msg).toBe("comment added successfully");
      });
  });

  test("user should be able to update a comment on a task", async () => {
    //register user1 into the database
    const user1 = await userModel.create(user1Reg);
    //register user2 into the database
    const user2 = await userModel.create(user2Reg);

    //login user
    const response = await request
      .post("/users/login")
      .send(user1Login)
      .expect(200);
    //  .expect(302)
    //  .expect((res) => {
    //    expect(res.text).toBe(loginSuccessText);
    //  });

    const taskDb = await taskModel.create({
      ...sweepTheFloorTask,
      owner: user1._id,
      status: "backlog",
      assignee: user2._id,
    });

    const commentDb = await commentModel.create({
      owner: user1._id,
      body: "nice work",
    });

    await request
      .put(`/comments/update/${commentDb._id}`)
      .set("token", response.body.token)
      .send({ comment: "work yet to be done" })
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe("success");
      });
  });

  test("user should be able to delete a comment on a task", async () => {
    //register user1 into the database
    const user1 = await userModel.create(user1Reg);
    //register user2 into the database
    const user2 = await userModel.create(user2Reg);

    //login user
    const response = await request
      .post("/users/login")
      .send(user1Login)
      .expect(200);
    //  .expect(302)
    //  .expect((res) => {
    //    expect(res.text).toBe(loginSuccessText);
    //  });

    const taskDb = await taskModel.create({
      ...sweepTheFloorTask,
      owner: user1._id,
      status: "backlog",
      assignee: user2._id,
    });

    const commentDb = await commentModel.create({
      owner: user1._id,
      body: "nice work",
    });

    await request
      .delete(`/comments/${commentDb._id}`)
      .set("token", response.body.token)
      .expect(200)
      .expect((res) => {
        expect(res.body.message).toBe("comment Deleted successfully");
      });
  });
});
