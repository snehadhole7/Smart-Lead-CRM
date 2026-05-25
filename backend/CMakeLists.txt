cmake_minimum_required(VERSION 3.18)
project(SmartLeadCRMBackend)
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(Threads REQUIRED)

add_executable(smart_lead_crm backend/src/main.cpp)

# Add Crow or CppCMS include paths here when installed.
# target_include_directories(smart_lead_crm PRIVATE /path/to/crow/include)
# target_link_libraries(smart_lead_crm PRIVATE Threads::Threads)
