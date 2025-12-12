"use client";

import "./globals.css";

import {
  DocumentEditor,
  Section,
  Stack,
  Grid2Col,
  Title,
  InfoRow,
  LessonList,
  Input,
  useDoc,
} from "@/components/document-editor";
import { EntriesWorkspace } from "@/components/entries-workspace";

// --- Receipt layout, purely presentational over DocumentEditor context ---

function ReceiptContent() {
  // No hook needed here anymore; DocumentEditor's courseCode input handles the fetching.
  const { data } = useDoc();

  return (
    <>
      <Title>Receipt</Title>

      <Section title="Basic Info">
        <Grid2Col>
          <Stack>
            <InfoRow label="Receipt No">
              <Input name="receiptNo" label="Receipt No" />
            </InfoRow>
            <InfoRow label="Student Name">
              <Input
                name="studentName"
                label="Student Name"
                className="font-medium"
              />
            </InfoRow>
            <InfoRow label="Student Code">
              <Input name="studentCode" label="Student Code" />
            </InfoRow>
            <InfoRow label="Gender">
              <Input
                name="gender"
                label="Gender"
                type="dropdown"
                options={["Male", "Female"]}
              />
            </InfoRow>
          </Stack>
          <Stack>
            <InfoRow label="Issue Date">
              <Input name="issueDate" label="Issue Date" type="date" />
            </InfoRow>
            <InfoRow label="Course Code">
              <Input name="courseCode" label="Course Code" />
            </InfoRow>
            <InfoRow label="Course Name">
              <span className="font-medium">COURSE NAME</span>
            </InfoRow>
          </Stack>
        </Grid2Col>
      </Section>

      <Section title="Lesson Info">
        <Stack>
          <InfoRow label="Total Lessons">12 Lessons</InfoRow>
          <InfoRow label="Duration">45 Minutes / Lesson</InfoRow>
        </Stack>
        <LessonList />
      </Section>

      <Section title="Add-ons">
        <Stack>
          <InfoRow label="Item Name">
            15-minute studio headshot session for kids
          </InfoRow>
          <InfoRow label="Description">
            At least 5 photos in jpg format (with basic retouch)
          </InfoRow>
          <InfoRow label="Price" strikethrough={true}>
            HKD 500.00
          </InfoRow>
        </Stack>
      </Section>

      <Section title="Price">
        <Grid2Col>
          <Stack>
            <InfoRow label="Section Price">section price</InfoRow>
            <InfoRow label="Discount">discount</InfoRow>
            <InfoRow label="Coupon">coupon</InfoRow>
          </Stack>
          <Stack>
            <InfoRow label="Paid Amount" bold>
              HKD 2,880.00
            </InfoRow>
            <InfoRow label="Payment Method">
              <Input name="paymentMethod" label="Payment Method" />
            </InfoRow>
            <InfoRow label="Payment Date">
              <Input
                name="paymentDate"
                label="Payment Date"
                type="datetime-local"
              />
            </InfoRow>
          </Stack>
        </Grid2Col>
      </Section>

      <Section title="Payment and Refunds">
        <Grid2Col>
          <Stack>
            <p className="font-semibold">Payment of Fees</p>
            <ul>
              <li>
                Fees must be paid in full before students may attend classes. We
                reserve the right to refuse entry to students if fees have not
                been paid on or before the first day of each term.
              </li>
              <li>
                For promotion offer / discounted booking, it is non-refundable,
                non-transferable and no cancellation.
              </li>
            </ul>
          </Stack>
          <Stack>
            <p className="font-semibold">Refunds</p>
            <ul>
              <li>
                We regret that we cannot, under any circumstances, give refunds
                for classes and credit already paid for.
              </li>
            </ul>
          </Stack>
        </Grid2Col>
      </Section>
    </>
  );
}

// --- Course plan layout, also purely presentational ---

function CoursePlanContent() {
  const { data } = useDoc();

  return (
    <>
      <Title>Course Plan</Title>

      <Section title="Basic Info">
        <Grid2Col>
          <Stack>
            <InfoRow label="Student Name">
              <Input
                name="studentName"
                label="Student Name"
                className="font-medium"
              />
            </InfoRow>
            <InfoRow label="Parent Contact">
              <Input name="parentContact" label="Parent Contact" />
            </InfoRow>
            <InfoRow label="Gender">
              <Input
                name="gender"
                label="Gender"
                type="dropdown"
                options={["Male", "Female"]}
              />
            </InfoRow>
          </Stack>
          <Stack>
            <InfoRow label="Issue Date">
              <Input name="issueDate" label="Issue Date" type="date" />
            </InfoRow>
            <InfoRow label="Course Code">
              <Input name="courseCode" label="Course Code" />
            </InfoRow>
            <InfoRow label="Course Name">
              <span className="font-medium">COURSE NAME</span>
            </InfoRow>
          </Stack>
        </Grid2Col>
      </Section>

      <Section title="Lesson Info">
        <Stack>
          <InfoRow label="Total Lessons">12 Lessons</InfoRow>
          <InfoRow label="Duration">45 Minutes / Lesson</InfoRow>
        </Stack>
        <LessonList />
      </Section>

      <Section title="Add-ons">
        <Stack>
          <InfoRow label="Item Name">
            15-minute studio headshot session for kids
          </InfoRow>
          <InfoRow label="Description">
            At least 5 photos in jpg format (with basic retouch)
          </InfoRow>
          <InfoRow label="Price" strikethrough={true}>
            HKD 500.00
          </InfoRow>
        </Stack>
      </Section>

      <Section title="Price">
        <Grid2Col>
          <Stack>
            <InfoRow label="Total Price">HKD 2,620.000</InfoRow>
            <InfoRow label="Discount">HKD 740.00</InfoRow>
          </Stack>
          <Stack>
            <InfoRow label="Discount Due Date" bold>
              31st August
            </InfoRow>
            <InfoRow label="Discounted Price">HKD 1880.00/student</InfoRow>
          </Stack>
        </Grid2Col>
      </Section>

      <Section title="Payment and Refunds">
        <Grid2Col>
          <Stack>
            <p className="font-semibold">Payment of Fees</p>
            <ul>
              <li>
                Fees must be paid in full before students may attend classes. We
                reserve the right to refuse entry to students if fees have not
                been paid on or before the first day of each term.
              </li>
              <li>
                For promotion offer / discounted booking, it is non-refundable,
                non-transferable and no cancellation.
              </li>
            </ul>
          </Stack>
          <Stack>
            <p className="font-semibold">Refunds</p>
            <ul>
              <li>
                We regret that we cannot, under any circumstances, give refunds
                for classes and credit already paid for.
              </li>
            </ul>
          </Stack>
        </Grid2Col>
      </Section>
    </>
  );
}

// --- Page: hand layouts to the EntriesWorkspace container ---

export default function Page() {
  return (
    <EntriesWorkspace
      ReceiptContent={ReceiptContent}
      CoursePlanContent={CoursePlanContent}
    />
  );
}
