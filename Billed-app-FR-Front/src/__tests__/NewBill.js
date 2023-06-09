/**
 * @jest-environment jsdom
 */

import { screen,fireEvent } from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js"
import { ROUTES, ROUTES_PATH } from '../constants/routes.js'
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore)


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then I visualize the form 'Send a Bills'", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      const form = screen.getByText("Envoyer une note de frais")
      expect(form).toBeTruthy()
    })
  })
})
describe("Given I am connected as an employee, I am on NewBill Page",()=>{
  describe("When I click on the 'Back' button of the browser",()=>{
    test("Then I am redirected to the Bills page",()=>{
      Object.defineProperty(window, 'localStorage', { value: localStorageMock})
      window.localStorage.setItem('user', JSON.stringify({type: 'Employee'}))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const PREVIOUS_LOCATION ='#employee/bills';
  
      window.onpopstate = (e) => {
        const user = JSON.parse(localStorage.getItem('user'))
        if (window.location.pathname === "/" && !user) {
          document.body.style.backgroundColor="#0E5AE5"
          root.innerHTML = ROUTES({ pathname: window.location.pathname })
        }
        else if (user) {
          onNavigate(PREVIOUS_LOCATION)
        }
      }
      window.onpopstate();
      expect(document.body.innerHTML).toContain('Mes notes de frais');
    })
  })

  describe("When I do not fill in the fields of the required form, I click on the 'Send' button",()=>{
    test("Then I am told to fill in the required fields, I still stay on form",()=>{
      document.body.innerHTML=NewBillUI();

      const form = screen.getByTestId("form-new-bill")
      const buttonNewBill = jest.fn((e) => e.preventDefault())
      form.addEventListener("submit", buttonNewBill)
      fireEvent.submit(form)

      expect(form).toBeTruthy()
      expect((screen.getByTestId("expense-name")).value).toBe('')
      expect((screen.getByTestId("amount")).value).toBe('')
      expect((screen.getByTestId("commentary")).value).toBe('')
      expect((screen.getByTestId("vat")).value).toBe('')
      expect((screen.getByTestId("pct")).value).toBe('')
      expect(document.getElementById("btn-send-bill")).toBeTruthy()
    })
  })

  describe("When I fill out the form with the wrong file format",()=>{
    test("Then I can't click the 'Submit' button",()=>{
      document.body.innerHTML =NewBillUI() 
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      const newBill = new NewBill({ document, onNavigate, store:null, localStorage: window.localStorage })

      const downloadFile = jest.fn((e) => newBill.handleChangeFile(e))
      
      const file = screen.getByTestId("file")
      const myTestFile = new File(["blablabla"], "monfichier.txt", { type: "text/plain" });
      file.addEventListener("change",downloadFile)
      fireEvent.change(file, {target: {files: [myTestFile]}})

      expect(downloadFile).toHaveBeenCalled()
      const consoleSpy = jest.spyOn(console, 'log');
      expect(consoleSpy).toBeTruthy()
      const buttonSubmit = screen.getByText("Envoyer")
      expect(buttonSubmit.disabled).toBe(true)
      consoleSpy.mockRestore()
    })
  })

  describe("When I fill in the form with a good file format (jpg,jpeg,png,gif), I can click on the 'Send' button",()=>{
    test("Then I am redirected to the Bills page with display of the new 'Bill' with a 'pending' status", ()=>{
      document.body.innerHTML =NewBillUI() 
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const newBill = new NewBill({ document, onNavigate, store:mockStore, localStorage: window.localStorage })
      const formNewBill = screen.getByTestId("form-new-bill")

      userEvent.selectOptions(formNewBill.querySelector(`select[data-testid="expense-type"]`), 'Transports');
      userEvent.type(formNewBill.querySelector(`input[data-testid="expense-name"]`), 'Apero collègue');
      userEvent.type(formNewBill.querySelector(`input[data-testid="amount"]`), '100');
      userEvent.type(formNewBill.querySelector(`input[data-testid="vat"]`), '20');
      userEvent.type(formNewBill.querySelector(`input[data-testid="pct"]`), '10');
      userEvent.type(formNewBill.querySelector(`textarea[data-testid="commentary"]`), 'C\'était cool !!');
      const dateInput = formNewBill.querySelector(`input[data-testid="datepicker"]`);
      dateInput.setAttribute('value', '2020-05-01');
      userEvent.click(dateInput); 
  
      newBill.fileUrl = 'https://example.com/';
      newBill.fileName = 'example-file.jpg';

      const updateBillSpy = jest.spyOn(newBill, "updateBill");
      const handleSubmit = jest.spyOn(newBill,"handleSubmit");

      handleSubmit({
        preventDefault: jest.fn(),
        target: formNewBill,
      });
      
      expect(updateBillSpy).toHaveBeenCalled();
      expect(screen.getByText("Mes notes de frais")).toBeTruthy();
    
// console.log(document.body.innerHTML)
      const updateBillArgs = updateBillSpy.mock.calls[0];
      const [billData] = updateBillArgs;
      expect(billData.name).toBe('Apero collègue');
      expect(billData.status).toBe('pending');
      expect(newBill.fileName).toBe("example-file.jpg")
    })
  })
})
 

// ///////////////////////////////////////////////////////////////////////////
// //////                  INTEGRATION TEST POST                     /////////
// ///////////////////////////////////////////////////////////////////////////

 describe("Given I am a user connected as Employee",()=>{
  describe("When I submit Form",()=>{
    test("Then the Bill is create with success, POST(201)", ()=>{
      document.body.innerHTML = NewBillUI()
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })

        const newBill= new NewBill({ document, onNavigate, store:mockStore, localStorage })
        const myBill = {type:"Transports", name:"Taxi aéroport", date:"2023-07-06", amount:100, vat:20, pct:20, commentary:"Embouteillage", fileUrl:"c://test/image.jpg", fileName:"image.jpg", status:"pending"}

        screen.getByTestId("expense-type").value = myBill.type;
        screen.getByTestId("expense-name").value = myBill.name;
        screen.getByTestId("datepicker").value = myBill.date;
        screen.getByTestId("amount").value = myBill.amount;
        screen.getByTestId("vat").value = myBill.vat;
        screen.getByTestId("pct").value = myBill.pct;
        screen.getByTestId("commentary").value = myBill.commentary;
        
        const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e))
        const file = screen.getByTestId("file")
        file.addEventListener("change",handleChangeFile)
        fireEvent.change(file, {target: {files: [myBill.fileUrl]}})

        const createBillMock = jest.fn().mockResolvedValue({ fileUrl: 'http://example.com', key: '1234' })
        jest.spyOn(newBill.store.bills(), 'create').mockImplementation(createBillMock);

        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
        const updateBillSpy = jest.spyOn(newBill, 'updateBill')

        const form = screen.getByTestId("form-new-bill")
        form.addEventListener("submit", handleSubmit)
        fireEvent.submit(form)

        expect(handleSubmit).toHaveBeenCalled()
        expect(updateBillSpy).toHaveBeenCalled()
        expect(handleChangeFile).toHaveBeenCalled()
        expect(createBillMock).toHaveBeenCalledWith({
          data: expect.any(FormData),
          headers: { noContentType: true }
        });
      
        expect(newBill.fileUrl).toBe("c://test/image.jpg")
        expect(newBill.fileName).toBe("image.jpg")
        expect(newBill.billId).toBe("1234")
      }
    })
  })

  describe("When an error occurs on API",()=>{
    test("fetches messages from an API POST and fails with 500 message error",() => {
      //Erreur  400 (Bad Request) 
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })}

      document.body.innerHTML=NewBillUI();
      console.log( document.body.innerHTML)

      const newBill = new NewBill({ document, onNavigate, store:{
        bills: jest.fn(() => ({
        create: jest.fn(() => Promise.reject(new Error('Erreur 404')))
      }))}, localStorage:window.localStorage });

      const consoleErrorMock = jest.spyOn(console, 'error');

      const event = {
        preventDefault: jest.fn(),
        target: {
          value: null
        }
      }
      try {
        newBill.handleChangeFile(event);
      } catch (error) {
        expect(error.message).toBe('Erreur 404');
        expect(consoleErrorMock).toHaveBeenCalledWith(error);
      }
      consoleErrorMock.mockRestore();
    })

    test("fetches messages from an API POST and fails with 500 message error",() => {
      // Erreur 500 (Internal Server Error)
      document.body.innerHTML=NewBillUI();
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })}
      const consoleErrorMock = jest.spyOn(console, 'error');
      const newBill = new NewBill({ document, onNavigate, store:{
          bills: jest.fn(() => ({
          create: jest.fn(() => Promise.reject(new Error('Erreur 500')))
        }))}, localStorage: window.localStorage });

      const fileName = 'test.jpg';
      const file = new File([''], fileName, { type: 'image/jpeg' });
      newBill.document.querySelector = jest.fn().mockReturnValue({
        files: [file]
      });

      const btnSendBill = newBill.document.getElementById('btn-send-bill');
      expect(btnSendBill.disabled).toBe(false);
        
      const event = {
        preventDefault: jest.fn(),
        target: {
          value: 'C:\\test\\test.jpg'
        }
      };
      try {
        newBill.handleChangeFile(event);
      } catch (error) {
        expect(error.message).toBe('Erreur 500');
        expect(consoleErrorMock).toHaveBeenCalledWith(error);
        expect(btnSendBill.disabled).toBe(true);
      }
        consoleErrorMock.mockRestore();
    });
  })

})

